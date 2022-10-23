export interface GameEnd {
    room: string, 
    scores: { userName: string, score: number }[]
}

export default GameEnd