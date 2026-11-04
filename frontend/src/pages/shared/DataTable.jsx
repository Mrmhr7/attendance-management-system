import {
  Box, Pagination, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from '@mui/material';
import EmptyState from '../../components/EmptyState';

export default function DataTable({ columns, rows, loading, meta, onPageChange, emptyMessage }) {
  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={28} />
      </Stack>
    );
  }
  if (!rows?.length) return <EmptyState message={emptyMessage} />;

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key} sx={{ fontWeight: 600 }}>{c.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row._id} hover>
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.render ? c.render(row) : row[c.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {meta && meta.totalPages > 1 && (
        <Stack alignItems="center" mt={2}>
          <Pagination count={meta.totalPages} page={meta.page} onChange={(_e, p) => onPageChange(p)} color="primary" />
        </Stack>
      )}
    </Box>
  );
}
