export interface RoundEnd {
    room: string,
    round: number,
    winner: string,
    score: Map<string, number>,
    word: string
}