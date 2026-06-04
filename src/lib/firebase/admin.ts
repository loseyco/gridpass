import * as admin from 'firebase-admin'

function getAdminApp() {
    if (admin.apps.length > 0) {
        return admin.apps[0]
    }

    try {
        return admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        })
    } catch (error) {
        console.error('Firebase admin credentials missing or failed to initialize:', error)
        return null
    }
}

export const getAdminDb = () => {
    const app = getAdminApp()
    if (!app) {
        console.error('Database connection failed: Firebase Admin app is not initialized.')
        return null
    }
    return app.firestore()
}

export const adminFirestore = admin.firestore
