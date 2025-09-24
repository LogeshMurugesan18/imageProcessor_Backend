module.exports = {
  createUserWithToken: async (sql, user) => {
    const { firstName, lastName, email, token } = user;
    await sql.query`
      INSERT INTO Users 
        (FirstName, LastName, Email, IsVerified, VerificationEmailSentOn, VerificationToken)
      VALUES 
        (${firstName}, ${lastName}, ${email}, 0, GETDATE(), ${token})
    `;
  },

  getUserByToken: async (sql, token) => {
    const result = await sql.query`
      SELECT * FROM Users WHERE VerificationToken = ${token}
    `;
    return result.recordset[0];
  },

  updateUserWithPassword: async (sql, token, hashedPassword) => {
    await sql.query`
      UPDATE Users
      SET Password = ${hashedPassword},
          IsVerified = 1,
          VerificationToken = NULL,
          IsActive = 1,
          LastUpdatedOn = GETDATE()
      WHERE VerificationToken = ${token}
    `;
  },

  getUserByEmail: async (sql, email) => {
    const result = await sql.query`
      SELECT * FROM Users WHERE Email = ${email}
    `;
    return result.recordset[0];
  }
};
