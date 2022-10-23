import UserDetail from "./userDetail"

export interface GameDetail {
    room: string, 
    players: UserDetail[]
    totalRounds: number
}

export default GameDetail