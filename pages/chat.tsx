import type { NextPage } from 'next'
import Chat from '../components/chat'
import styles from '../styles/Home.module.css'

const ChatPage: NextPage = () => {
    return (
        <main className={styles.main}>
            <Chat></Chat>
        </main>
    )
}

export default ChatPage
function useUserContext() {
    throw new Error('Function not implemented.')
}

