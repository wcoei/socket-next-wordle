import type { NextApiRequest, NextApiResponse } from 'next'
import { Server, Socket } from 'socket.io'
import { SendMessage } from '../../types/sendMessage'
import { RoomRequest } from '../../types/roomRequest'
import Wordle from '../../game/wordle'
import { GameRequest } from '../../types/gameRequest'
import { GameRequestResult } from '../../types/gameRequestResult'
import { RoundStart } from '../../types/roundStart'
import { GuessWord } from '../../types/guessWord'
import { GameEnd } from '../../types/gameEnd'
import { UserDetail } from '../../types/userDetail'
import { UserRoomLeave } from '../../types/userRoomLeave'
import { GameDetail } from '../../types/gameDetail'

const rooms = new Map<string, {roomCreatorScoketId: string, isInGame: boolean, roomMembers: UserDetail[]}>()
const games = new Map<string, Wordle>()
const userSockets = new Map<string, UserDetail>()

const SocketHandler = (req: any, res: any) => {

  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {

      socket.on('user-connect', (msg: UserDetail) => {
        console.log(`userid: ${msg.userId} userName: ${msg.userName} is connected through socket ${socket.id}`)
        userSockets.set(socket.id, msg)
      })

      socket.on("disconnecting", (reason) => {
        socket.rooms.forEach((room) => {
          const reply: UserRoomLeave = {
            userId: userSockets.get(socket.id)?.userId!,
            userName: userSockets.get(socket.id)?.userName!,
            room
          }
          socket.in(room).emit('userroom-leaved', reply)
        })

        let removedRooms: string [] = []
        rooms.forEach((room, roomName) => {
          console.log(`${room.roomCreatorScoketId} vs ${socket.id}`)
          if (room.roomCreatorScoketId === socket.id) {
            socket.in(roomName).emit('room-destroyed', roomName)
            removedRooms.push(roomName)
          }
          room.roomMembers = room.roomMembers.filter((userDetail)=>{
            return userDetail.userId != userSockets.get(socket.id)?.userId
          })
        })
        removedRooms.forEach((room) => {
          console.log(`remove room ${room} due to creator leaving`)
          rooms.delete(room)
        })
      });

      socket.on("disconnect", (reason) => {
        console.log(`userName ${userSockets.get(socket.id)?.userName} disconnected: ${reason} `);
        userSockets.delete(socket.id)
      });

      socket.on('input-change', (msg: SendMessage) => {
        // socket.broadcast.emit('update-input', `${msg.text}`)
        console.log(`room ${msg.room}: ${rooms.get(msg.room)?.isInGame}`)

        // chating allow if game is not started 
        if (!rooms.get(msg.room)?.isInGame) {
          io.in(msg.room).emit('update-input', msg)
        }
      })

      socket.on('guess-word', (msg: GuessWord) => {
        // socket.broadcast.emit('update-input', `${msg.text}`)
        const game = games.get(msg.room)
        const result = game!.guess(msg)

        io.in(msg.room).emit('word-guessed', result)
        console.log(`room ${msg.room}: ${rooms.get(msg.room)?.isInGame}; user: ${msg.userName}; userId: ${msg.userId}; turn: ${msg.round} guess: ${msg.word} result: ${result.result}`)
        if (result.isWin) {
          if (game!.isGameEnd()) {
            console.log(`game ended ${msg.room}`)
            const roomDetails = rooms.get(msg.room)!
            roomDetails.isInGame = false
            rooms.set(msg.room, roomDetails)

            const scores: { userName: string, score: number }[]= [] 
            game!.getScore().forEach(element => {
              scores.push({
                userName: element.userName,
                score: element.score
              })
            });
            const gameEndMsg: GameEnd = {
              room: msg.room,
              scores
            }
            io.in(msg.room).emit('game-ended', gameEndMsg)
          } else {
            //TODO send round results
            console.log(`win: room ${msg.room}: ${rooms.get(msg.room)?.isInGame}; user: ${msg.userName}; turn: ${msg.round} guess: ${msg.word} result: ${result.result}`)
            const roundStarted = game!.newRound()
            io.in(msg.room).emit('round-started', roundStarted)
          }
        }
      })

      socket.on('join-room', (msg: RoomRequest) => {
        socket.join(msg.room)
        let userDetail: UserDetail = {
          userId: msg.userId,
          userName: msg.userName
        }
        if (!rooms.has(msg.room)) {
          rooms.set(msg.room, { roomCreatorScoketId: socket.id, isInGame: false, roomMembers: [ userDetail ]})
          io.sockets.emit('room-created', msg)
          console.log(`User ${msg.userName} creates room ${msg.room}`)
        } else {
          const roomDetail = rooms.get(msg.room)
          roomDetail!.roomMembers.push(userDetail)
        }
        io.in(msg.room).emit('room-joined', msg)
        console.log(`User ${msg.userName} joins room: ${msg.room}`)
      })

      socket.on('request-game', (msg: GameRequest) => {
        const { room, userId } = msg

        console.log(`Requesting game in room ${room}, room status is ${rooms.get(room)?.isInGame}`)
        if (rooms.get(room)?.isInGame) {
          const reply: GameRequestResult = {
            result: false,
            message: "Game is started already in the room"
          }
          socket.emit("game-requested", reply)
        } else {
          const gameDetail: GameDetail = {
            room,
            players: rooms.get(room)!.roomMembers,
            totalRounds: 5
          }
          const game = new Wordle(gameDetail)
          games.set(room, game)

          const roomDetails = rooms.get(room)!
          roomDetails.isInGame = true
          rooms.set(room, roomDetails)

          const gameRequestResult: GameRequestResult = {
            result: true
          }
          io.in(room).emit('game-requested', gameRequestResult)
          const roundStarted = game.newRound()
          io.in(room).emit('round-started', roundStarted)
        }
      })

    })
  }
  res.end()
}

export default SocketHandler