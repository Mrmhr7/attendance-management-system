import { Stack, Typography } from '@mui/material';
import InboxIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({ message = 'Nothing to show yet' }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 6, color: 'text.secondary' }}>
      <InboxIcon fontSize="large" />
      <Typography>{message}</Typography>
    </Stack>
  );
}
