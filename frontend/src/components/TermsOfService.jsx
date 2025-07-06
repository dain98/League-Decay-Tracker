import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const TermsOfService = () => (
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
        Terms of Service
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        1. Acceptance of Terms
      </Typography>
      <Typography paragraph>
        By using this application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
      </Typography>
      <Typography variant="h6" gutterBottom>
        2. Use of Service
      </Typography>
      <Typography paragraph>
        You agree to use the service only for lawful purposes and in accordance with these terms. You are responsible for your use of the app and any data you provide.
      </Typography>
      <Typography variant="h6" gutterBottom>
        3. Account Security
      </Typography>
      <Typography paragraph>
        You are responsible for maintaining the confidentiality of your account and password. The app is not liable for any loss or damage arising from your failure to protect your credentials.
      </Typography>
      <Typography variant="h6" gutterBottom>
        4. Modifications
      </Typography>
      <Typography paragraph>
        We reserve the right to modify or discontinue the service at any time, with or without notice. Continued use of the app after changes constitutes acceptance of those changes.
      </Typography>
      <Typography variant="h6" gutterBottom>
        5. Disclaimer
      </Typography>
      <Typography paragraph>
        This app is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of the service.
      </Typography>
      <Typography variant="h6" gutterBottom>
        6. Contact
      </Typography>
      <Typography paragraph>
        If you have any questions about these Terms, please contact us at <a href="mailto:business@dain.cafe">business@dain.cafe</a>.
      </Typography>
    </Paper>
  </Container>
);

export default TermsOfService; 
