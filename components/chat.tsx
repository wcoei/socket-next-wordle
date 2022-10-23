import { useEffect, useRef, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { SendMessage } from '../types/sendMessage'
import { RoomRequest } from '../types/roomRequest'
import { useUserContext } from '../context/user'
import { GameRequest } from '../types/gameRequest'
import { GameRequestResult } from '../types/gameRequestResult'
import { RoundStart } from '../types/roundStart'
import { GuessWord } from '../types/guessWord'
import { GuessWordResult } from '../types/guessWordResult'
import { GameEnd } from '../types/gameEnd'
import UserRoomLeave from '../types/userRoomLeave'


let socket: Socket

const Chat = () => {
  const [input, setInput] = useState('')
  const [room, setRoom] = useState('')
  const [isInRoom, setIsInRoom] = useState(false)
  const [isInputAllow, setIsInputAllow] = useState(false)
  const userName = useUserContext()!.userName
  const userId = useUserContext()!.userId
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [isInGame, setIsInGame] = useState(false)
  const [round, setRound] = useState(-1)

  useEffect(() => {
    // problem: socket will initialize twice because useEffect will
    // fire twice in dev mode if StrictMode is used

    console.log('Initialize')
    socketInitializer().then()

    return () => {
      console.log('Clean up socket handlers')
      if (socket) {
        socket.off('connect', connecthandler)
        socket.off('update-input', updateInputHandler)
        socket.off('room-joined', roomJoinedHandler)
        socket.off('room-created', roomRequestHandler)
        socket.off('game-requested', gameRequestedHandler)
        socket.off('round-started', rounstartedhandler)
        socket.off('word-guessed', wordGuessedHandler)
        socket.off('game-ended', gameEndedHandler)
        socket.off('userroom-leaved', userRoomLeavedHandler)
        socket.off('room-destroyed', roomDestroyedHandler)
      }
    }

  }, [])

  const connecthandler = () => {
    console.log('connected')
  }

  const updateInputHandler = (msg: SendMessage) => {
    appendLog(`${msg.userName}: ${msg.text}`)
  }

  const roomJoinedHandler = (msg: RoomRequest) => {
    appendLog(`User ${msg.userName} joins room ${msg.room}`)
    setIsInRoom(true)
    setIsInputAllow(true)
  }

  const roomRequestHandler = (msg: RoomRequest) => {
    appendLog(`User ${msg.userName} creates room: ${msg.room}`)
  }

  const gameRequestedHandler = (msg: GameRequestResult) => {
    if (msg.result) {
      setIsInGame(true)
      appendLog(`Game start`)
    } else {
      appendLog(`Game requested failed, probably another user has requested game already`)
    }
  }

  const rounstartedhandler = (msg: RoundStart) => {
    setRound(msg.round)
    appendLog(`Round ${msg.round} start`)
  }

  const wordGuessedHandler = (msg: GuessWordResult) => {
    const { userName, word, result, message } = msg
    if (message) {
      appendLog(`${message}`)
    } else {
      appendLog(`${userName} guess: ${word} => ${result}`)
    }
  }

  const userRoomLeavedHandler = (msg: UserRoomLeave) => {
    appendLog(`${msg.userName} leaves room ${msg.room}`)
  }

  const gameEndedHandler = (msg: GameEnd) => {
    setIsInGame(false)
    appendLog(`Game ended\nScores:`)
    msg.scores.forEach((detail) => {
      appendLog(`Player ${detail.userName}: ${detail.score}`)
    })
  }

  const roomDestroyedHandler = (msg: string) => {
    setIsInGame(false)
    setIsInRoom(false)
    appendLog(`Room ${room} destroyed. `)
  }

  const socketInitializer = async () => {
    await fetch('/api/socket')
    socket = io()
    socket.emit('user-connect', { userId, userName })
    socket.on('connect', connecthandler)
    socket.on('update-input', updateInputHandler)
    socket.on('room-joined', roomJoinedHandler)
    socket.on('room-created', roomRequestHandler)
    socket.on('game-requested', gameRequestedHandler)
    socket.on('round-started', rounstartedhandler)
    socket.on('word-guessed', wordGuessedHandler)
    socket.on('game-ended', gameEndedHandler)
    socket.on('userroom-leaved', userRoomLeavedHandler)
    socket.on('room-destroyed', roomDestroyedHandler)

  }

  const appendLog = (text: string) => {
    if (textAreaRef && textAreaRef.current) {
      textAreaRef.current!.value += `\n${text}`
      textAreaRef.current!.value = textAreaRef.current!.value.trim()
      const end = textAreaRef.current!.value.length;
      textAreaRef.current!.setSelectionRange(end, end);
      textAreaRef.current!.focus();
    }
  }

  const sendMessage = () => {
    if (!isInGame && input.trim().startsWith('[wordle]')) {
      const msg: GameRequest = {
        room,
        userId,
        userName
      }
      socket.emit('request-game', msg)
    } else if (isInGame) {
      const msg: GuessWord = {
        room,
        userId,
        userName,
        word: input,
        round
      }
      socket.emit('guess-word', msg)

    } else {
      const msg: SendMessage = {
        room,
        userId,
        userName,
        text: input
      }
      socket.emit('input-change', msg)
    }
    setInput('')
  }

  const joinRoom = async () => {
    const msg: RoomRequest = {
      room,
      userId,
      userName
    }
    socket.emit('join-room', msg)
  }

  return (
    <div>
      <div>
        <p>
          Note: join a room and then type &quot;[wordle]&quot; to create a Wordle game <br />
          User Name: {userName}
        </p>
        <input
          placeholder="Room name"
          value={room}
          onChange={e => setRoom(e.target.value)}
          disabled={isInRoom}
        />

        <button onClick={joinRoom} disabled={isInRoom}>Join Room</button>
      </div>
      <div>
        <input size={60}
          placeholder="Your message"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={!isInRoom}
        />
        <button onClick={sendMessage} disabled={!isInRoom}>Send</button>
      </div>
      <div>
        <textarea rows={20} cols={60} ref={textAreaRef} readOnly></textarea>
      </div>
    </div>
  )
}

export default Chat;