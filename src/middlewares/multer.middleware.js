import multer from "multer";

const storage = multer.diskStorage({
    /** set destination for file upload */
    destination: (req, file, cb) => {
        cb(null, "./public/temp")
    },
    /** set custom filename */
    filename: (req, file, cb) => {
        // const customfilename = Date.now() + "-" + file.originalname
        // console.log(file.originalname)
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage,
})