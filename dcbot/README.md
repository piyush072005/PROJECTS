# Discord Registration Bot

A Discord bot that handles user registrations and automatically groups them into pairs. The bot accepts registrations when 4 valid user mentions are provided (all users must be in the same server), and can handle 8-12 total registrations.

## Features

- ✅ Register 4 users at a time with validation
- ✅ Validates that all mentioned users are in the same server
- ✅ Prevents duplicate registrations
- ✅ Groups registered users into pairs (8-12 users total)
- ✅ Admin commands for managing registrations
- ✅ Status and listing commands

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot" and confirm
5. Under "Token", click "Reset Token" and copy the token
6. Enable the following Privileged Gateway Intents:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT (if needed)

### 2. Invite Bot to Your Server

1. Go to the "OAuth2" > "URL Generator" section
2. Select the following scopes:
   - `bot`
   - `applications.commands` (optional, for slash commands)
3. Select the following bot permissions:
   - Send Messages
   - Read Message History
   - Manage Roles (required for creating and assigning roles)
   - Manage Channels (required for creating private channels)
   - Mention Everyone (optional)
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Bot Token

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and paste your bot token:
   ```
   DISCORD_BOT_TOKEN=your_actual_bot_token_here
   ```

### 5. Run the Bot

```bash
python bot.py
```

You should see a message confirming the bot has logged in!

## Commands

| Command | Description |
|---------|-------------|
| `!register @user1 @user2 @user3 @user4` | Register a team of 4 users (all must be in the same server) |
| `!list` | List all registered teams and users |
| `!pair` | Pair teams together and create private channels (Admin only, requires 2+ teams) |
| `!status` | Check registration status |
| `!clear` | Clear all registrations, roles, and channels (Admin only) |
| `!help_bot` | Show help message with all commands |

## Usage Example

1. **Register teams:**
   ```
   !register @Alice @Bob @Charlie @Diana
   !register @Eve @Frank @Grace @Henry
   ```
   Each registration creates a team of 4 users.

2. **Check status:**
   ```
   !status
   ```

3. **List registered teams:**
   ```
   !list
   ```

4. **Pair teams and create channels (Admin only, after 2+ teams registered):**
   ```
   !pair
   ```
   This will:
   - Pair Team 1 & Team 2 into Group 1
   - Pair Team 3 & Team 4 into Group 2
   - Create a role for all registered users
   - Create private channels for each group (accessible only to admins and the role)

## Requirements

- Python 3.8 or higher (Python 3.11 or 3.12 recommended for best compatibility)
- discord.py library (>=2.4.0)
- python-dotenv library
- aiohttp library (>=3.10.0 for Python 3.13 compatibility)

## Notes

- The bot accepts 8-48 total user registrations (2-12 teams)
- Each registration must include exactly 4 user mentions (forms one team)
- All mentioned users must be in the same Discord server
- Users cannot be registered twice
- Teams are paired together: Team 1 & 2 = Group 1, Team 3 & 4 = Group 2, etc.
- The `!pair` command creates:
  - A role called "Registered Participants" for all registered users
  - Private text channels for each group in a "Tournament Groups" category
  - Channels are only accessible to administrators and users with the role

## Troubleshooting

- **Bot doesn't respond:** Make sure the bot token is correct and the bot is online
- **"User not in server" error:** Ensure all mentioned users are members of the server
- **Permission errors:** Make sure the bot has "Send Messages" permission in the channel
- **`ModuleNotFoundError: No module named 'cgi'` (Python 3.13):** 
  This error occurs because Python 3.13 removed the `cgi` module. To fix:
  1. Uninstall old packages: `pip uninstall discord.py aiohttp -y`
  2. Reinstall with updated versions: `pip install -r requirements.txt --upgrade`
  3. If the issue persists, consider using Python 3.11 or 3.12 instead

