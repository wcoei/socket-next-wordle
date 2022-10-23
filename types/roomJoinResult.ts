export interface RoomJoinResult {
    userId: string,
    userName: string,
    room: string,
    result: boolean,
    message?: string
}

export default RoomJoinResult