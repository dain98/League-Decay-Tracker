import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const Privacy = () => (
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
        Privacy Policy
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        1. Information We Collect
      </Typography>
      <Typography paragraph>
        We collect information you provide when you register, use the app, or contact us. This may include your email address, display name, authentication provider, and usage data such as login times and feature usage. We do not collect sensitive personal information unless you explicitly provide it.
      </Typography>
      <Typography variant="h6" gutterBottom>
        2. How We Use Information
      </Typography>
      <Typography paragraph>
        We use your information to operate, maintain, and improve the service, personalize your experience, communicate with you, and ensure security and compliance. We may also use aggregated, anonymized data for analytics and service improvement.
      </Typography>
      <Typography variant="h6" gutterBottom>
        3. Sharing of Information
      </Typography>
      <Typography paragraph>
        We do not sell your personal information. We may share data with trusted service providers (such as authentication or hosting providers) only as necessary to operate the service, or as required by law.
      </Typography>
      <Typography variant="h6" gutterBottom>
        4. Data Security
      </Typography>
      <Typography paragraph>
        We implement reasonable security measures to protect your data, including encryption in transit and access controls. However, no method of transmission or storage is 100% secure.
      </Typography>
      <Typography variant="h6" gutterBottom>
        5. Data Retention
      </Typography>
      <Typography paragraph>
        We retain your information only as long as necessary to provide the service and fulfill legal obligations. You may request deletion of your account and associated data at any time by contacting us.
      </Typography>
      <Typography variant="h6" gutterBottom>
        6. Changes to This Policy
      </Typography>
      <Typography paragraph>
        We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.
      </Typography>
      <Typography variant="h6" gutterBottom>
        7. Contact
      </Typography>
      <Typography paragraph>
        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:business@dain.cafe">business@dain.cafe</a>.
      </Typography>
    </Paper>
  </Container>
);

export default Privacy; 
