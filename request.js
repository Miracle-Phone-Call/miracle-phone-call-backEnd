const { Pool } = require("pg")

// Get first name
app.patch("/users/username",async(req,res) => {
  const firstName = req.body
  const userName = req.params.username
  const updateFirstName = await Pool.query('UPDATE users SET first_name = $1 WHERE username = $2 RETURNING *', [firstName,userName]).then(results => results.rows[0])
  res.status(200).json(updateFirstName)
})