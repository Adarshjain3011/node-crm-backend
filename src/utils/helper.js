


export async function checkUserExists(userId) {

    try {

        const isuserExists = await User.findById(userId);

        return isuserExists;

    } catch (error) {

        console.log(error);

        throw new Error("user does not exists with given id");
    }

}

