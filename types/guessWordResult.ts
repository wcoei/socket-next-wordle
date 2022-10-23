export interface GuessWordResult {
    room: string,
    userId: string,
    userName: string,
    round: number,
    word: string,
    result: string,
    isWin: boolean,
    message?: string
}

export default GuessWordResult