import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";


interface UserProviderProps {
  children?: any
}

interface UserContextProps {
  userName: string,
  userId: string,
  setUserName: Dispatch<SetStateAction<string>>
  setUserId: Dispatch<SetStateAction<string>>
}

const Context = createContext<UserContextProps | null>(null);

export function UserProvider({ children } : UserProviderProps) {
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  return (
    <Context.Provider value={{userName, userId, setUserName, setUserId}}>{children}</Context.Provider>
  );
}

export function useUserContext() {
  return useContext(Context);
}