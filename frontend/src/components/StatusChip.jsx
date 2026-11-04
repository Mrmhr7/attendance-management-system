import { Chip } from '@mui/material';
import { statusColor } from '../utils/format';

export default function StatusChip({ status }) {
  return <Chip size="small" label={status} color={statusColor(status)} variant={statusColor(status) === 'default' ? 'outlined' : 'filled'} />;
}
