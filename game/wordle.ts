import { WORDS } from "../data/words";
import { GameDetail } from "../types/gameDetail";
import { GuessWord }  from "../types/guessWord";
import { GuessWordResult } from "../types/guessWordResult";
import { RoundStart } from "../types/roundStart";

class Wordle {
    private room: string = ''
    private totalRounds = 1
    private currentRound = 0
    private currentWord = ''
    private isCurrentRoundHasWinner = true
    private wordLength = 5

    private playerDetails = new Map<string, {userName: string, score: number }>()

    constructor({ room, players, totalRounds }: GameDetail) {
        this.room = room
        this.totalRounds = totalRounds
        players.forEach((player) => {
            console.log(`Game player added: ${player.userName}`)
            this.playerDetails.set(player.userId, {
                userName: player.userName,
                score: 0
            })
        })
    }

    public newRound(): RoundStart {
        if (this.isCurrentRoundHasWinner) {
            this.currentWord = this.pickWord()
            this.currentRound++;
            this.isCurrentRoundHasWinner = false
        }
        return {
            room: this.room,
            round: this.currentRound
        }
    }

    public guess(input: GuessWord) {
        let { room, userName, userId, round, word } = input
        console.log(`Player ${userName} guess ${word} answer: ${this.currentWord} `)

        if (word.length != this.wordLength) {
            const reply: GuessWordResult = {
                room, 
                userId,
                userName,
                round, 
                word, 
                result: "X".repeat(this.wordLength), 
                isWin: false, 
                message: `Word should have ${this.wordLength} charaters`
            }
            return reply
        }

        if (this.isCurrentRoundHasWinner || this.currentRound != round) {
            const reply: GuessWordResult = {
                room, 
                userId, 
                userName,
                round,
                word, 
                result: "X".repeat(this.wordLength), 
                isWin: false, 
                message: `Current round has ended`
            }
            return reply
        }

        let result = word.toLowerCase();

        function replaceAt(input: string, index: number, char: string) {
            const result = input.split('');
            result[index] = char;
            return result.join('');
        }

        for (let i = 0; i < this.currentWord.length; i++) {
            if (result[i] === this.currentWord[i]) {
                result = replaceAt(result, i, 'O');
                continue;
            }
            if (this.currentWord.indexOf(result[i]) >= 0) {
                result = replaceAt(result, i, '-');
                continue;
            }
            result = replaceAt(result, i, 'X');
        }
        if (result === 'O'.repeat(this.wordLength)) {
            const playerDetail = this.playerDetails.get(userId)
            if (playerDetail) {
                playerDetail.score++ 
                this.playerDetails.set(userId, playerDetail)
            } else {
                console.log(`userId not found: ${userId}`)
            }
            this.isCurrentRoundHasWinner = true
        }

        const reply: GuessWordResult = {
            room, 
            userId,
            userName, 
            round, 
            word, 
            result, 
            isWin: result === 'O'.repeat(this.wordLength)
        }
        console.log(JSON.stringify(reply))
        return reply
    }

    public isGameEnd() {
        return this.currentRound >= this.totalRounds ? true : false
    }

    public getScore() {
        return this.playerDetails
    }

    private pickWord() {
        return WORDS[Math.floor((WORDS.length - 1) * Math.random())]
    }
}

export default Wordle