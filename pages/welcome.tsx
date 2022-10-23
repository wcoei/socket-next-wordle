import type { NextPage } from 'next'
import { useState } from 'react'
import styles from '../styles/Home.module.css'
import { useUserContext } from '../context/user'
import { useRouter } from 'next/router'
import { nanoid } from 'nanoid'

const Welcome: NextPage = () => {
    const [regUserName, setRegUserName] = useState('')
    const { setUserName, setUserId } = useUserContext()!;
    const router = useRouter()

    const registerUser = () => {
        setUserName(regUserName)
        setUserId(nanoid())
        router.push('/chat')
    }

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                Please provide your name
                <input value={regUserName} onChange={e => setRegUserName(e.target.value)} placeholder="Enter your name" />
                <button onClick={registerUser}>
                    Register
                </button>
            </div>
        </main>
    )
}

export default Welcome
