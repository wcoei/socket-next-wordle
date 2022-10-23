import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'
import { useUserContext } from '../context/user'
import styles from '../styles/Home.module.css'

type LayoutProps = {
    children: ReactNode
}

const Layout = ({ children }: LayoutProps) => {
    const userName = useUserContext()?.userName ?? ''
    const router = useRouter()
    const url = router.asPath

    useEffect(() => {
        if (url === '/') {
            return
        }
        if (url !== '/welcome' && !userName) {
            router.push('/welcome')
            return
        }
    }, [userName, router, url])

    return (
        <>
            <div className={styles.container}>
                {children}
            </div>
        </>
    )
}

export default Layout
