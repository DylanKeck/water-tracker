import type {Profile} from "~/utils/models/profile-schema";
import {createCookieSessionStorage} from "react-router";
import * as process from "node:process";

type SessionData = {
    profile: Profile
    authorization: string
}
type SessionFlashData = {
    error: string
}

const { getSession, commitSession, destroySession } = createCookieSessionStorage<SessionData, SessionFlashData>(
    {
        cookie: {
            name: 'earl-grey',
            httpOnly: true,
            maxAge: 10800,
            path: "/",
            sameSite: "strict",
            secrets: [process.env.SESSION_SECRET as string],
            secure: true,
        }
    }
)

export { getSession, commitSession, destroySession }