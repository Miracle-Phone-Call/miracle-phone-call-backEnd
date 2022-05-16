const express = require('express')
const router = express.Router();


router.get('/:id', (req, res) => {
    let {id} = req.params

    res.status(200).json({message: `User ${id} is here`})
})


module.exports = router;