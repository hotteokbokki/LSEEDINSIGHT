const express = require("express");
const session = require("express-session");
const cors = require("cors");
const { router: authRoutes, requireAuth } = require("./routes/authRoutes");
const axios = require("axios");
const ngrok = require("ngrok"); // Exposes your local server to the internet
const { getPrograms, getProgramNameByID } = require("./controllers/programsController");
const { getTelegramUsers } = require("./controllers/telegrambotController");
const { getSocialEnterprisesByProgram, getSocialEnterpriseByID } = require("./controllers/socialenterprisesController");
require("dotenv").config();
const { getUsers } = require("./controllers/usersController");
const pgDatabase = require("./database.js"); // Import PostgreSQL client
const cookieParser = require("cookie-parser");
const { getMentorsBySocialEnterprises, getMentorById } = require("./controllers/mentorsController.js");

const app = express();

// Enable CORS with credentials
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

// Configure session handling
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use a secure key
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Use HTTPS in production
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Use authentication routes
app.use("/auth", authRoutes);

// Store users who interacted with the bot
let users = {}; // Consider using MongoDB or another database for persistence
const PASSWORD = 'q@P#3_4)V5vUw+LJ!F'; // Set a secure password for authentication

// Helper function to send messages
async function sendMessage(chatId, message) {
  try {
      const response = await axios.post(TELEGRAM_API_URL, {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown' // Optional: If you want Markdown formatting in your messages
      });
      return response.data;
  } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
  }
}

// Helper function to send messages with inline keyboard
async function sendMessageWithInlineKeyboard(chatId, message, options) {
  try {
    const inlineKeyboard = options.map(option => [option]);// Convert to 2D array inside the function
    console.log("Inline Keyboard:", inlineKeyboard); // Debugging log

      const response = await axios.post(TELEGRAM_API_URL, {
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
          reply_markup: {
              inline_keyboard: inlineKeyboard,
          },
      });
      return response.data;
  } catch (error) {
    console.error("Failed to send message with inline keyboard:", error.response?.data || error.message);
  }
}

async function sendMessageWithOptions(chatId, message, options) {
  try {
    console.log("Inline Keyboard:", options); // Debugging log

    const response = await axios.post(TELEGRAM_API_URL, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: options, // Use directly without additional mapping
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to send message with inline keyboard:", error.response?.data || error.message);
  }
}

// Example of a protected route
app.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "Access granted to protected route" });
});

app.get("/getUsers", async (req, res) => {
  const enterpriseId = 'dc705825-6e77-4c2a-8ac0-c12baf56d6e0'
  const mentors = await getMentorsBySocialEnterprises(enterpriseId);

  res.json(mentors);
});

app.post("/webhook", async (req, res) => {
  const message = req.body.message || req.body.edited_message;
  const callbackQuery = req.body.callback_query;

  // Handle text messages (Registration, Password Check)
  if (message) {
    const chatId = message.chat.id;
    const userName = message.chat.username || "Unknown User";
    const firstName = message.chat.first_name || "No First Name";
    const lastName = message.chat.last_name || "No Last Name";

    try {
      // Fetch user and programs in parallel
      const [existingUser, options] = await Promise.all([
        getTelegramUsers(chatId),
        getPrograms(), 
      ]);

      // If user already exists, prevent re-registration
      if (existingUser) {
        if (message.text === "/start") {
          await sendMessage(chatId, "✅ You are already registered! No need to enter the password again.");
        }
        return res.sendStatus(200); // No need to proceed further if user is registered
      }

      // If unregistered user sends /start, ask for the password
      if (message.text === "/start") {
        await sendMessage(chatId, "🔑 Please enter the password to register and continue interacting with the bot.");
        return res.sendStatus(200);
      }

      // If user enters password and options are available
      if (message.text === PASSWORD) {
        if (options[0].length === 0) {
          await sendMessage(chatId, "⚠️ No programs available at the moment. Please try again later.");
          return res.sendStatus(200);
        }

        await sendMessageWithInlineKeyboard(
          chatId,
          "✅ Password correct! You have been successfully registered.\n\nPlease choose your program:",
          options
        );
        return res.sendStatus(200);
      }

      // If password is incorrect
      await sendMessage(chatId, "❌ Incorrect password. Please try again.");
      return res.sendStatus(200);

    } catch (error) {
      console.error("Error handling message:", error);
      return res.sendStatus(500); // Internal server error in case of failure
    }
  }

  if (callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const callbackQueryId = callbackQuery.id;
    const data = callbackQuery.data;

    // Check if the callbackQueryId is valid
    if (!callbackQueryId || !data) {
        console.error("Invalid or expired callback query received.");
        return res.sendStatus(400); // Bad request if the query is invalid
    }

    try {
        if (data.startsWith("program_")) {
            // Handle program selection as before
            const programId = data.replace("program_", "");
            const selectedProgram = await getProgramNameByID(programId);

            if (!selectedProgram) {
                return res.sendStatus(400); // Invalid selection
            }

            // Acknowledge the callback query immediately
            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: "✅ Choice received!",
                show_alert: false,
            }).catch(err => console.error("Failed to acknowledge callback:", err.response?.data || err.message));

            const socialEnterprises = await getSocialEnterprisesByProgram(programId);

            if (socialEnterprises.length === 0) {
                await sendMessage(chatId, `⚠️ No social enterprises available under *${selectedProgram}*.`);
                return res.sendStatus(200);
            }

            // Map the data correctly
            const enterpriseOptions = socialEnterprises.map(se => ({
                text: se.text.replace(" - ", "\n"), // Break at " - " for better readability
                callback_data: se.callback_data
            }));

            // Wrap in a 2D array (Telegram requires this)
            const inlineKeyboard = enterpriseOptions.map(option => [option]);

            await sendMessageWithOptions(
                chatId,
                `✅ You selected *${selectedProgram}*!\n\nPlease choose a social enterprise:`,
                inlineKeyboard
            );

            return res.sendStatus(200);
        } else if (data.startsWith("enterprise_")) {
            // Handle social enterprise selection
            const enterpriseId = data.replace("enterprise_", "");
            const selectedEnterprise = await getSocialEnterpriseByID(enterpriseId);

            console.log(selectedEnterprise);

            if (!selectedEnterprise) {
                return res.sendStatus(400); // Invalid selection
            }

            // Acknowledge the callback query immediately
            axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text: "✅ Choice received!",
                show_alert: false,
            }).catch(err => console.error("Failed to acknowledge callback:", err.response?.data || err.message));

            // Send message to user confirming the social enterprise selection
            //await sendMessage(chatId, `✅ You selected *${selectedEnterprise.team_name}*!`);

            //Mentor
            const mentors = await getMentorsBySocialEnterprises(enterpriseId);
            console.log("Fetched Mentors:", mentors);
            if (mentors.length === 0) {
              await sendMessage(chatId, `⚠️ No mentors available under *${selectedEnterprise.name}*.`);
              return res.sendStatus(200);
            }
            // Map the data correctly
            const mentorOptions = mentors.map(m => ({
              text: m.text,
              callback_data: m.callback_data
            }));
            // Wrap in a 2D array (Telegram requires this)
            const inlineKeyboard = mentorOptions.map(option => [option]);
            await sendMessageWithOptions(
              chatId,
              `✅ You selected *${selectedEnterprise.team_name}*!\n\nPlease choose your Mentor:`,
              inlineKeyboard
            );
            return res.sendStatus(200);
          } else if (data.startsWith("mentor_")) {
            // Handle social enterprise selection
            const mentorId = data.replace("mentor_", "");
            const selectedMentor = await getMentorById(mentorId);
      
            if (!selectedMentor) {
              return res.sendStatus(400); // Invalid selection
            }
      
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
              callback_query_id: callbackQueryId,
              text: "✅ Choice received!",
              show_alert: false,
            });
      
            await sendMessage(chatId, `✅ You selected *${selectedMentor.mentor_firstName} ${selectedMentor.mentor_lastName}*!`);
            // ...

            return res.sendStatus(200);
        }
    } catch (error) {
        console.error("Error processing callback query:", error);
        return res.sendStatus(500); // Internal server error if callback fails
    }
}

});

// Send Message to a User (using stored Telegram User ID)
app.post("/send-message", async (req, res) => {
  try {
    console.log(`🔍 Fetching user details for: ${email}`);

    // Query PostgreSQL for user details
    const query = 'SELECT * FROM "Users" WHERE email = $1';
    const values = [email];
    
    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      console.log(`⚠️ No user found for email: ${email}`);
      return res.status(404).json({ error: "User not found." });
    }

    const user = result.rows[0];

    console.log("✅ User found:", user);

    // Extract user details
    const { first_name, last_name, telegramChatId } = user;

    console.log(`📌 User Details:
      - First Name: ${first_name}
      - Last Name: ${last_name}
      - Email: ${email}
      - Telegram Chat ID: ${telegramChatId}
    `);

    if (!telegramChatId) {
      console.log("⚠️ User does not have a Telegram chat ID linked.");
      return res.status(400).json({ error: "User has not linked their Telegram account." });
    }

    const message = `
    *📢 Mentor Feedback Notification*

    🌟 *Mentor Feedback Summary*
    - **Mentor**: John Doe
    - **Rating**: ⭐⭐⭐⭐⭐ (5/5)
    - **Comments**:
    \`\`\`
    This mentor is fantastic! Keep up the great work.
    \`\`\`

    ✅ *Acknowledge Feedback*
    Please click the link below to acknowledge that you have received this feedback:

    [✅ Acknowledge Feedback](http://example.com/acknowledge)
    `;

    console.log(`🚀 Sending message to ${first_name} ${last_name} (${email}) on Telegram...`);

    const response = await sendMessage(telegramChatId, message);

    console.log("✅ Message sent successfully:", response);
    res.json({ success: true, response });
    
  } catch (error) {
    console.error("❌ Error in /send-feedback route:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/updateUserRole/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // 'admin' or 'user'

  try {
    // Update the user's role in the database
    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
    const values = [role, id];
    const result = await pgDatabase.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]); // Respond with updated user data
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
const PORT = 4000;

// Function to set the webhook
async function setWebhook(ngrokUrl) {
  const webhookUrl = `${ngrokUrl}/webhook`;

  try {
      const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
          url: webhookUrl,
      });

      if (response.data.ok) {
          console.log(`✅ Webhook successfully set to: ${webhookUrl}`);
      } else {
          console.log(`❌ Failed to set webhook:`, response.data);
      }
  } catch (error) {
      console.error(`❌ Error setting webhook: ${error.message}`);
  }
}

// Start the server and ngrok tunnel
app.listen(PORT, async () => {
  console.log(`🚀 Localhost running on: http://localhost:${PORT}`);

  try {
      const ngrokUrl = await ngrok.connect(PORT);
      console.log(`🌍 Ngrok tunnel running at: ${ngrokUrl}`);

      // Set the webhook automatically
      await setWebhook(ngrokUrl);
  } catch (error) {
      console.log(`❌ Couldn't tunnel ngrok: ${error.message}`);
  }
});
