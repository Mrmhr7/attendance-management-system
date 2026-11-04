import { Card, CardContent, Stack, Typography } from '@mui/material';

export default function StatCard({ label, value, icon, color = 'primary.main' }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid #e5e7eb', height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          {icon && (
            <Stack sx={{ color, bgcolor: 'action.hover', p: 1.2, borderRadius: 2 }} justifyContent="center">
              {icon}
            </Stack>
          )}
          <Stack>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
