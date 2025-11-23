import discord
from discord.ext import commands, tasks
import os
from dotenv import load_dotenv
import asyncio
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Bot setup
intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix='!', intents=intents)

# Store registered teams (each team has 4 users and a team name)
# Format: [{"name": "Team Name", "members": [user1, user2, user3, user4]}, ...]
registered_teams = []
MAX_USERS = 48
MIN_USERS = 8
USERS_PER_TEAM = 4

# Store created roles and channels
registered_role = None  # Common role for all registered users
group_roles = []  # List of roles for each group (Grp1, Grp2, etc.)
group_channels = []

# Registration status
registration_active = False
registration_channel = None
registration_start_time = None  # When registration started (for 8-hour timer)

# Scheduled registration time (24-hour format: HH:MM)
scheduled_registration_time = None  # Format: (hour, minute) e.g., (14, 30) for 2:30 PM
scheduled_registration_channel_id = None  # Channel ID where registration should start

@bot.event
async def on_ready():
    print(f'{bot.user} has logged in!')
    print(f'Bot is ready to accept registrations!')
    # Start background tasks
    if not check_registration_time.is_running():
        check_registration_time.start()
    if not clear_roles_after_8_hours.is_running():
        clear_roles_after_8_hours.start()

@tasks.loop(minutes=1)
async def check_registration_time():
    """Check every minute if it's time to start registration"""
    global scheduled_registration_time, scheduled_registration_channel_id, registration_active
    
    if scheduled_registration_time is None or scheduled_registration_channel_id is None:
        return
    
    if registration_active:
        return
    
    # Get current time
    now = datetime.now()
    current_hour = now.hour
    current_minute = now.minute
    
    scheduled_hour, scheduled_minute = scheduled_registration_time
    
    # Check if it's time to start registration (within the same minute)
    if current_hour == scheduled_hour and current_minute == scheduled_minute:
        # Get the channel
        channel = bot.get_channel(scheduled_registration_channel_id)
        if channel:
            # Create a fake context for the start_registration function
            # We'll call the registration logic directly
            await auto_start_registration(channel)

@tasks.loop(minutes=1)
async def clear_roles_after_8_hours():
    """Check every minute if 8 hours have passed since registration started"""
    global registration_start_time, registered_role, group_roles
    
    if registration_start_time is None:
        return
    
    # Check if 8 hours have passed
    now = datetime.now()
    time_diff = now - registration_start_time
    
    if time_diff >= timedelta(hours=8):
        # Clear all roles from users
        for guild in bot.guilds:
            # Clear registered_role
            if registered_role:
                try:
                    for member in guild.members:
                        if registered_role in member.roles:
                            await member.remove_roles(registered_role, reason="8 hours passed - clearing roles")
                except:
                    pass
            
            # Clear group roles
            for role in group_roles:
                try:
                    for member in guild.members:
                        if role in member.roles:
                            await member.remove_roles(role, reason="8 hours passed - clearing roles")
                except:
                    pass
        
        # Reset the timer
        registration_start_time = None
        print("✅ Cleared all roles from users after 8 hours")

@bot.command(name='set_registration_time')
async def set_registration_time(ctx, hour: int, minute: int, channel: discord.TextChannel = None):
    """
    Set the time for automatic daily registration start (Admin only).
    Usage: !set_registration_time <hour> <minute> [channel]
    Example: !set_registration_time 14 30 (for 2:30 PM)
    """
    # Check if user has admin permissions
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("❌ You need administrator permissions to use this command.")
        return
    
    global scheduled_registration_time, scheduled_registration_channel_id
    
    # Validate time
    if hour < 0 or hour > 23:
        await ctx.send("❌ Hour must be between 0 and 23 (24-hour format).")
        return
    
    if minute < 0 or minute > 59:
        await ctx.send("❌ Minute must be between 0 and 59.")
        return
    
    # Set the scheduled time
    scheduled_registration_time = (hour, minute)
    
    # Set the channel (use provided channel or current channel)
    if channel:
        scheduled_registration_channel_id = channel.id
    else:
        scheduled_registration_channel_id = ctx.channel.id
    
    target_channel = bot.get_channel(scheduled_registration_channel_id)
    
    # Format time for display
    time_str = f"{hour:02d}:{minute:02d}"
    am_pm = "AM" if hour < 12 else "PM"
    display_hour = hour if hour <= 12 else hour - 12
    if display_hour == 0:
        display_hour = 12
    time_display = f"{display_hour}:{minute:02d} {am_pm}"
    
    embed = discord.Embed(
        title="✅ Registration Time Set",
        description=f"Automatic registration will start daily at **{time_display}** ({time_str})",
        color=discord.Color.green()
    )
    embed.add_field(name="Channel", value=target_channel.mention if target_channel else "Unknown", inline=False)
    embed.set_footer(text="Registration will start automatically at this time every day")
    
    await ctx.send(embed=embed)

@bot.command(name='disable_scheduled_registration')
async def disable_scheduled_registration(ctx):
    """
    Disable automatic daily registration (Admin only).
    """
    # Check if user has admin permissions
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("❌ You need administrator permissions to use this command.")
        return
    
    global scheduled_registration_time, scheduled_registration_channel_id
    
    scheduled_registration_time = None
    scheduled_registration_channel_id = None
    
    embed = discord.Embed(
        title="✅ Scheduled Registration Disabled",
        description="Automatic daily registration has been disabled.",
        color=discord.Color.orange()
    )
    await ctx.send(embed=embed)

async def auto_start_registration(channel):
    """Automatically start registration (called by scheduled task)"""
    global registration_active, registration_channel, registered_teams, registered_role, registration_start_time
    
    if registration_active:
        return
    
    registration_active = True
    registration_channel = channel
    registered_teams = []  # Clear previous registrations
    registration_start_time = datetime.now()  # Set start time for 8-hour timer
    
    # Create or get the common "Registered" role
    guild = channel.guild
    try:
        role_name = "Registered"
        existing_role = discord.utils.get(guild.roles, name=role_name)
        
        if existing_role:
            registered_role = existing_role
        else:
            registered_role = await guild.create_role(
                name=role_name,
                color=discord.Color.green(),
                mentionable=True,
                reason="Common role for all registered tournament participants"
            )
    except discord.Forbidden:
        await channel.send("❌ Bot doesn't have permission to create roles. Please grant 'Manage Roles' permission.")
        registration_active = False
        return
    except Exception as e:
        await channel.send(f"❌ Error creating role: {str(e)}")
        registration_active = False
        return
    
    # Create embed for registration announcement
    embed = discord.Embed(
        title="🎮 Tournament Registration Started!",
        description="Registration is now OPEN!",
        color=discord.Color.green()
    )
    embed.add_field(
        name="How to Register",
        value="Simply type your **team name** followed by mentioning 4 team members:\n"
              "`Team Name @member1 @member2 @member3 @member4`\n\n"
              "Example: `My Awesome Team @user1 @user2 @user3 @user4`",
        inline=False
    )
    embed.add_field(
        name="Requirements",
        value=f"• Each team must have exactly 4 members\n"
              f"• Maximum {MAX_USERS} total users ({MAX_USERS // USERS_PER_TEAM} teams)\n"
              f"• All members must be in this server\n"
              f"• Each person can only be in one team",
        inline=False
    )
    embed.set_footer(text=f"Registration will close when {MAX_USERS} slots are filled")
    
    await channel.send("@everyone", embed=embed)
    await channel.send("✅ Registration is now active! Users can register their teams.")

@bot.command(name='start_registration')
async def start_registration(ctx):
    """
    Start registration process (Admin only).
    Pings @everyone to notify that registration is open.
    """
    # Check if user has admin permissions
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("❌ You need administrator permissions to use this command.")
        return
    
    global registration_active, registration_channel, registered_teams, registered_role, registration_start_time
    
    if registration_active:
        await ctx.send("⚠️ Registration is already active!")
        return
    
    registration_active = True
    registration_channel = ctx.channel
    registered_teams = []  # Clear previous registrations
    registration_start_time = datetime.now()  # Set start time for 8-hour timer
    
    # Create or get the common "Registered" role
    guild = ctx.guild
    try:
        role_name = "Registered"
        existing_role = discord.utils.get(guild.roles, name=role_name)
        
        if existing_role:
            registered_role = existing_role
        else:
            registered_role = await guild.create_role(
                name=role_name,
                color=discord.Color.green(),
                mentionable=True,
                reason="Common role for all registered tournament participants"
            )
    except discord.Forbidden:
        await ctx.send("❌ Bot doesn't have permission to create roles. Please grant 'Manage Roles' permission.")
        registration_active = False
        return
    except Exception as e:
        await ctx.send(f"❌ Error creating role: {str(e)}")
        registration_active = False
        return
    
    # Create embed for registration announcement
    embed = discord.Embed(
        title="🎮 Tournament Registration Started!",
        description="Registration is now OPEN!",
        color=discord.Color.green()
    )
    embed.add_field(
        name="How to Register",
        value="Simply type your **team name** followed by mentioning 4 team members:\n"
              "`Team Name @member1 @member2 @member3 @member4`\n\n"
              "Example: `My Awesome Team @user1 @user2 @user3 @user4`",
        inline=False
    )
    embed.add_field(
        name="Requirements",
        value=f"• Each team must have exactly 4 members\n"
              f"• Maximum {MAX_USERS} total users ({MAX_USERS // USERS_PER_TEAM} teams)\n"
              f"• All members must be in this server\n"
              f"• Each person can only be in one team",
        inline=False
    )
    embed.set_footer(text=f"Registration will close when {MAX_USERS} slots are filled")
    
    await ctx.send("@everyone", embed=embed)
    await ctx.send("✅ Registration is now active! Users can register their teams.")

@bot.event
async def on_message(message):
    # Ignore bot messages
    if message.author.bot:
        await bot.process_commands(message)
        return
    
    # Check if registration is active and message is in registration channel
    global registration_active, registration_channel, registered_teams, registered_role, MAX_USERS
    
    if registration_active and message.channel == registration_channel:
        # Check if message has exactly 4 mentions
        mentions = message.mentions
        
        if len(mentions) == 4:
            # Extract team name (everything before the mentions)
            content = message.content
            for mention in mentions:
                content = content.replace(mention.mention, "").replace(f"<@{mention.id}>", "")
            
            team_name = content.strip()
            
            # If no team name provided, use default
            if not team_name:
                team_name = f"Team {len(registered_teams) + 1}"
            
            # Validate and register team
            server = message.guild
            invalid_users = []
            valid_users = []
            
            # Get all currently registered user IDs
            all_registered_user_ids = set()
            for team_data in registered_teams:
                all_registered_user_ids.update([user.id for user in team_data["members"]])
            
            for user in mentions:
                # Check if user is in the server
                member = server.get_member(user.id)
                if member is None:
                    invalid_users.append(user)
                else:
                    # Check if user is already registered in any team
                    if user.id in all_registered_user_ids:
                        await message.channel.send(f"❌ {user.mention} is already registered in another team!")
                        return
                    valid_users.append(user)
            
            if invalid_users:
                invalid_names = ", ".join([u.name for u in invalid_users])
                await message.channel.send(f"❌ The following users are not in this server: {invalid_names}")
                return
            
            # Calculate total users if this team is added
            total_users = sum(len(team_data["members"]) for team_data in registered_teams) + len(valid_users)
            
            # Check if adding this team would exceed max users
            if total_users > MAX_USERS:
                current_users = sum(len(team_data["members"]) for team_data in registered_teams)
                await message.channel.send(
                    f"❌ Maximum users reached ({MAX_USERS} users). Currently have {current_users} users. Cannot add this team."
                )
                return
            
            # All validations passed - register the team
            registered_teams.append({
                "name": team_name,
                "members": valid_users
            })
            total_users_now = sum(len(team_data["members"]) for team_data in registered_teams)
            
            # Assign common "Registered" role to all team members
            if registered_role:
                try:
                    for user in valid_users:
                        member = server.get_member(user.id)
                        if member and registered_role not in member.roles:
                            await member.add_roles(registered_role, reason="User registered for tournament")
                except:
                    pass  # Silently fail if can't assign role
            
            # Create confirmation message
            user_list = ", ".join([u.mention for u in valid_users])
            team_number = len(registered_teams)
            await message.channel.send(
                f"✅ **{team_name}** registered successfully!\n"
                f"👥 Team members: {user_list}\n"
                f"📊 Total users: {total_users_now}/{MAX_USERS} | Total teams: {team_number}"
            )
            
            # Check if registration is full
            if total_users_now >= MAX_USERS:
                registration_active = False
                await message.channel.send("@everyone")
                await message.channel.send("🔴 **REGISTRATION FULL FOR TODAY**")
                embed = discord.Embed(
                    title="Registration Closed",
                    description=f"All {MAX_USERS} slots have been filled!",
                    color=discord.Color.red()
                )
                await message.channel.send(embed=embed)
                return
    
    # Process commands normally
    await bot.process_commands(message)


@bot.command(name='pair')
async def pair(ctx):
    """
    Pair teams together (Team 1 & 2 = Group 1, Team 3 & 4 = Group 2, etc.)
    Creates a role for each group (Grp1, Grp2, etc.) and private channels for each group.
    """
    global group_roles, group_channels
    
    # Check if user has admin permissions
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("❌ You need administrator permissions to use this command.")
        return
    
    # Get all users from all teams
    total_users = sum(len(team_data["members"]) for team_data in registered_teams)
    
    if total_users < MIN_USERS:
        await ctx.send(
            f"❌ Not enough users! Need at least {MIN_USERS} users. "
            f"Currently have {total_users} users across {len(registered_teams)} team(s)."
        )
        return
    
    if total_users > MAX_USERS:
        await ctx.send(f"❌ Too many users! Maximum is {MAX_USERS}.")
        return
    
    # Check if we have an even number of teams for pairing
    if len(registered_teams) < 2:
        await ctx.send("❌ Need at least 2 teams to create pairs. Each group consists of 2 teams.")
        return
    
    guild = ctx.guild
    
    # Pair teams: Team 1 & 2 = Group 1, Team 3 & 4 = Group 2, etc.
    groups = []
    for i in range(0, len(registered_teams), 2):
        if i + 1 < len(registered_teams):
            # Pair two teams together
            team1_data = registered_teams[i]
            team2_data = registered_teams[i + 1]
            groups.append((team1_data, team2_data))
        else:
            # Odd number of teams - last team is unpaired
            groups.append((registered_teams[i], None))
    
    # Clear existing roles and channels if re-pairing
    if group_roles:
        for role in group_roles:
            try:
                # Remove role from all members before deleting
                for member in guild.members:
                    if role in member.roles:
                        await member.remove_roles(role, reason="Re-pairing teams")
                await role.delete(reason="Re-pairing teams")
            except:
                pass
        group_roles = []
    
    if group_channels:
        for channel in group_channels:
            try:
                await channel.delete()
            except:
                pass
        group_channels = []
    
    # Create role for each group and assign to users
    try:
        for idx, (team1_data, team2_data) in enumerate(groups, 1):
            if team2_data:
                # Get all users from both teams
                group_users = team1_data["members"] + team2_data["members"]
                team1_name = team1_data["name"]
                team2_name = team2_data["name"]
                
                # Create role for this group (Grp1, Grp2, etc.)
                role_name = f"Grp{idx}"
                existing_role = discord.utils.get(guild.roles, name=role_name)
                
                if existing_role:
                    group_role = existing_role
                else:
                    group_role = await guild.create_role(
                        name=role_name,
                        color=discord.Color.blue(),
                        mentionable=True,
                        reason=f"Role for Group {idx} participants"
                    )
                
                group_roles.append(group_role)
                
                # Assign role to all users in this group
                added_count = 0
                for user in group_users:
                    member = guild.get_member(user.id)
                    if member and group_role not in member.roles:
                        await member.add_roles(group_role, reason=f"User assigned to Group {idx}")
                        added_count += 1
                
                if added_count > 0:
                    await ctx.send(f"✅ Created role {group_role.mention} and assigned to {added_count} user(s) in Group {idx}.")
    except discord.Forbidden:
        await ctx.send("❌ Bot doesn't have permission to create/assign roles. Please grant 'Manage Roles' permission.")
        return
    except Exception as e:
        await ctx.send(f"❌ Error creating/assigning roles: {str(e)}")
        return
    
    # Create private channels for each group
    category = None
    try:
        # Try to find or create a category for tournament channels
        category_name = "Tournament Groups"
        category = discord.utils.get(guild.categories, name=category_name)
        
        if not category:
            category = await guild.create_category(
                category_name,
                reason="Category for tournament group channels"
            )
        
        # Create channels for each group
        created_channels = []
        for idx, (team1_data, team2_data) in enumerate(groups, 1):
            if team2_data:
                # Get all users from both teams
                group_users = team1_data["members"] + team2_data["members"]
                team1_name = team1_data["name"]
                team2_name = team2_data["name"]
                user_mentions = ", ".join([user.mention for user in group_users])
                
                # Get the role for this group
                group_role = group_roles[idx - 1]  # idx is 1-based, list is 0-based
                
                # Create channel
                channel_name = f"group-{idx}"
                overwrites = {
                    guild.default_role: discord.PermissionOverwrite(view_channel=False),
                    group_role: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
                    guild.me: discord.PermissionOverwrite(view_channel=True, send_messages=True, manage_messages=True)
                }
                
                # Add admin permissions
                for role in guild.roles:
                    if role.permissions.administrator:
                        overwrites[role] = discord.PermissionOverwrite(view_channel=True, send_messages=True, manage_messages=True)
                
                channel = await category.create_text_channel(
                    channel_name,
                    overwrites=overwrites,
                    reason=f"Private channel for Group {idx}"
                )
                group_channels.append(channel)
                created_channels.append((idx, channel, group_users, group_role, team1_name, team2_name))
                
                # Send welcome message in the channel with team names
                welcome_embed = discord.Embed(
                    title=f"👥 Group {idx}",
                    description=f"Welcome to Group {idx}! This is a private channel for your teams.",
                    color=discord.Color.green()
                )
                welcome_embed.add_field(
                    name="Teams",
                    value=f"**{team1_name}**\n{', '.join([user.mention for user in team1_data['members']])}\n\n"
                          f"**{team2_name}**\n{', '.join([user.mention for user in team2_data['members']])}",
                    inline=False
                )
                welcome_embed.add_field(
                    name="All Members",
                    value=user_mentions,
                    inline=False
                )
                welcome_embed.add_field(
                    name="Role",
                    value=f"All members have been assigned the {group_role.mention} role.",
                    inline=False
                )
                await channel.send(embed=welcome_embed)
        
        # Create summary embed
        embed = discord.Embed(
            title="✅ Teams Paired Successfully!",
            description=f"Total Users: {total_users} | Total Teams: {len(registered_teams)} | Total Groups: {len(groups)}",
            color=discord.Color.green()
        )
        
        group_text = ""
        for idx, channel, group_users, group_role, team1_name, team2_name in created_channels:
            user_list = ", ".join([user.mention for user in group_users])
            group_text += f"**Group {idx}:** {channel.mention}\n"
            group_text += f"📋 Teams: **{team1_name}** & **{team2_name}**\n"
            group_text += f"👥 Members: {user_list}\n"
            group_text += f"🎭 Role: {group_role.mention}\n\n"
        
        embed.add_field(name="Created Groups", value=group_text, inline=False)
        embed.set_footer(text="Access granted to group-specific roles and administrators")
        
        await ctx.send(embed=embed)
        
    except discord.Forbidden:
        await ctx.send("❌ Bot doesn't have permission to create channels. Please grant 'Manage Channels' permission.")
        return
    except Exception as e:
        await ctx.send(f"❌ Error creating channels: {str(e)}")
        return

@bot.command(name='list')
async def list_registered(ctx):
    """
    List all registered teams and users.
    """
    if not registered_teams:
        await ctx.send("📋 No teams registered yet.")
        return
    
    total_users = sum(len(team_data["members"]) for team_data in registered_teams)
    
    team_list = ""
    for team_idx, team_data in enumerate(registered_teams, 1):
        team_name = team_data["name"]
        user_list = ", ".join([user.mention for user in team_data["members"]])
        team_list += f"**{team_name}:** {user_list}\n"
    
    embed = discord.Embed(
        title="📋 Registered Teams",
        description=team_list,
        color=discord.Color.green()
    )
    embed.set_footer(text=f"Total: {len(registered_teams)} team(s) | {total_users}/{MAX_USERS} users")
    
    await ctx.send(embed=embed)

@bot.command(name='clear')
async def clear_registrations(ctx):
    """
    Clear all team registrations, roles, and channels (Admin only).
    """
    # Check if user has admin permissions
    if not ctx.author.guild_permissions.administrator:
        await ctx.send("❌ You need administrator permissions to use this command.")
        return
    
    global registered_teams, group_roles, group_channels, registered_role, registration_active
    
    team_count = len(registered_teams)
    user_count = sum(len(team_data["members"]) for team_data in registered_teams)
    
    # Remove common "Registered" role from all members
    if registered_role:
        try:
            for member in ctx.guild.members:
                if registered_role in member.roles:
                    await member.remove_roles(registered_role, reason="Clearing tournament registrations")
        except:
            pass
    
    # Delete created channels
    deleted_channels = 0
    for channel in group_channels:
        try:
            await channel.delete()
            deleted_channels += 1
        except:
            pass
    
    # Remove roles from all members and delete the roles
    deleted_roles = 0
    for role in group_roles:
        try:
            # Remove role from all members
            for member in ctx.guild.members:
                if role in member.roles:
                    await member.remove_roles(role, reason="Clearing tournament registrations")
            # Delete the role
            await role.delete(reason="Clearing tournament registrations")
            deleted_roles += 1
        except:
            pass
    
    # Clear all data
    registered_teams = []
    group_channels = []
    group_roles = []
    registration_active = False
    
    await ctx.send(
        f"✅ Cleared {team_count} team(s) ({user_count} users).\n"
        f"🗑️ Deleted {deleted_channels} channel(s).\n"
        f"🎭 Deleted {deleted_roles} role(s).\n"
        f"📋 Registration list is now empty."
    )

@bot.command(name='status')
async def status(ctx):
    """
    Check registration status.
    """
    global scheduled_registration_time, registration_start_time
    
    total_users = sum(len(team_data["members"]) for team_data in registered_teams)
    remaining = MAX_USERS - total_users
    can_pair = total_users >= MIN_USERS
    
    embed = discord.Embed(
        title="📊 Registration Status",
        color=discord.Color.blue()
    )
    embed.add_field(name="Registration Active", value="✅ Yes" if registration_active else "❌ No", inline=True)
    embed.add_field(name="Registered Teams", value=str(len(registered_teams)), inline=True)
    embed.add_field(name="Total Users", value=f"{total_users}/{MAX_USERS}", inline=True)
    embed.add_field(name="Remaining Slots", value=str(remaining), inline=True)
    embed.add_field(name="Can Create Pairs", value="✅ Yes" if can_pair else "❌ No", inline=True)
    
    # Show scheduled time if set
    if scheduled_registration_time:
        hour, minute = scheduled_registration_time
        time_str = f"{hour:02d}:{minute:02d}"
        am_pm = "AM" if hour < 12 else "PM"
        display_hour = hour if hour <= 12 else hour - 12
        if display_hour == 0:
            display_hour = 12
        time_display = f"{display_hour}:{minute:02d} {am_pm}"
        embed.add_field(name="Scheduled Time", value=f"{time_display} ({time_str}) daily", inline=False)
    
    # Show time until roles are cleared
    if registration_start_time:
        now = datetime.now()
        time_diff = now - registration_start_time
        hours_remaining = 8 - (time_diff.total_seconds() / 3600)
        if hours_remaining > 0:
            embed.add_field(
                name="⏰ Roles Auto-Clear",
                value=f"Roles will be cleared in {hours_remaining:.1f} hours (8 hours after registration start)",
                inline=False
            )
    
    if total_users < MIN_USERS:
        embed.add_field(
            name="⚠️ Notice",
            value=f"Need {MIN_USERS - total_users} more user(s) to start pairing.",
            inline=False
        )
    
    await ctx.send(embed=embed)

@bot.command(name='help_bot')
async def help_bot(ctx):
    """
    Show help message with all available commands.
    """
    embed = discord.Embed(
        title="🤖 Registration Bot Commands",
        description="Commands to manage user registrations and pairing",
        color=discord.Color.purple()
    )
    
    commands_list = [
        ("`!set_registration_time <hour> <minute> [channel]`", "Set automatic daily registration time (Admin only, 24-hour format)"),
        ("`!disable_scheduled_registration`", "Disable automatic daily registration (Admin only)"),
        ("`!start_registration`", "Start registration process manually - pings @everyone (Admin only)"),
        ("`Team Name @user1 @user2 @user3 @user4`", "Register a team (no prefix needed, just type team name and mention 4 members)"),
        ("`!list`", "List all registered teams and users"),
        ("`!pair`", "Pair teams together and create private channels (Admin only, requires 2+ teams)"),
        ("`!status`", "Check registration status and scheduled time"),
        ("`!clear`", "Clear all team registrations, roles, and channels (Admin only)"),
        ("`!help_bot`", "Show this help message")
    ]
    
    for cmd, desc in commands_list:
        embed.add_field(name=cmd, value=desc, inline=False)
    
    embed.set_footer(text=f"Bot accepts {MIN_USERS}-{MAX_USERS} total users (2-3 teams of 4 users each)")
    
    await ctx.send(embed=embed)

# Run the bot
if __name__ == "__main__":
    token = os.getenv('DISCORD_BOT_TOKEN')
    if not token:
        print("Error: DISCORD_BOT_TOKEN not found in environment variables!")
        print("Please create a .env file with your bot token.")
    else:
        bot.run(token)

