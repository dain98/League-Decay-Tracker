import React from 'react';
import { Container, Typography, Paper, Link } from '@mui/material';

const About = () => (
  <Container
    maxWidth="md"
    sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 0,
      py: 4,
    }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 4,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      <Typography variant="h3" gutterBottom>
        About Us
      </Typography>
      <Typography paragraph sx={{ mt: 3 }}>
        Hey! I'm <Link href="https://twitter.com/imd_js" target="_blank" rel="noopener noreferrer">Dain</Link>, a software engineer based in the US. <strong>LoL Decay Tracker</strong> is a project I started because I was tired of logging into every single one of my accounts just to check how many decay days I had left. After some encouragement from friends, I decided to build this tool for myself—and for anyone else who finds decay tracking a pain.
      </Typography>
      <Typography paragraph>
        Here's how it works: LoL Decay Tracker uses the Riot API to mimic the way the in-game decay system works. Since Riot doesn't provide decay numbers directly, you'll need to input your initial decay days manually. From there, the app keeps track for you.
      </Typography>
      <Typography paragraph>
        With that said--the app isn't perfect. For some reason, the decay refresh time isn't exactly midnight every night, but rather fluctuates between 30 to 40 minutes after midnight. Also, remade games are <strong>NOT</strong> counted towards bank decay days, and yet the Riot API doesn't have an exact flag for remade games. I tried to use the game duration to manually detect remade games, but it's more of a band-aid fix. If any of these inconsistencies occur, you'll have to manually update the decay days yourself. But also, if this ever happens, please let me know. I want to make this as consistent as possible.
      </Typography>
      <Typography paragraph>
        You can reach me at <Link href="mailto:business@dain.cafe">business@dain.cafe</Link> or DM me on <Link href="https://twitter.com/messages/compose?recipient_id=1553448286278848512" target="_blank" rel="noopener noreferrer">Twitter</Link>. I'm always happy to hear feedback or answer questions!
      </Typography>
    </Paper>
  </Container>
);

export default About; 
