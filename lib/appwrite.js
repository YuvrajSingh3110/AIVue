import {
    Account,
    Avatars,
    Client,
    Databases,
    ID,
    Query,
    Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.example.aivue",
    projectId: "66c380070014ffeb532e",
    databaseId: "66c381c4002447aff6f0",
    userCollectionId: "66c3827f0037b91927ee",
    videoCollectionId: "66c382c8000d88a4d604",
    storageId: "66c384b10025cd403e80",
};

const client = new Client();
client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

const account = new Account(client);
const storage = new Storage(client);
const avatars = new Avatars(client);
const databases = new Databases(client);

export const createUser = async (email, password, username) => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        );

        if (!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password);

        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
            }
        );

        return newUser;
    } catch (e) {
        throw new Error(e);
    }
}

export const signIn = async (email, password) => {
    try {
        const existingSessions = await account.listSessions();

        // Log out the current session if it exists
        if (existingSessions.total > 0) {
            await account.deleteSession('current');
        }

        const session = await account.createEmailPasswordSession(email, password);

        return session;
    } catch (e) {
        throw new Error(e)
    }
}

export async function getAccount() {
    try {
        const currentAccount = await account.get();

        return currentAccount;
    } catch (error) {
        throw new Error(error);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await getAccount();
        console.log('user')
        if (!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal("accountId", currentAccount.$id)]
        );
        console.log(currentUser);

        if (!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (e) {
        throw new Error(e);
    }
}

export const getAllPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId
        );

        return posts.documents;
    } catch (e) {
        throw new Error(e);
    }
}

export const getLatestPosts = async () => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId,
            [Query.orderDesc("$createdAt"), Query.limit(7)]
        );
        return posts.documents;
    } catch (e) {
        console.log(`error while fetching latest posts ${e}`)
        throw new Error(e);
    }
}

export const searchPosts = async (query) => {
    try {
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.videoCollectionId,
            [Query.search('title', query)]
        );
        return posts.documents;
    } catch (e) {
        throw new Error(e);
    }
}