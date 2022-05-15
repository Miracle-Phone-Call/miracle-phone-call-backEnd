const { Pool } = require("pg")

//DELETE THE USER ACCOUNT
app.delete("/users/username", async(req, res) => {
  const userName = req.params.username
  const delteUsername = await Pool.query('DELETE FROM users WHERE username = $1', [userName])
  res.status(200).json(delteUsername)
})