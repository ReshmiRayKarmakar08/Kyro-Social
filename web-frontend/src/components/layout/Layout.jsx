import { Box } from '@mui/material';
import Header from './Header';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import BottomNav from './BottomNav';

const HEADER_HEIGHT = { xs: 60, sm: 72 };

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          pt: { xs: `${HEADER_HEIGHT.xs}px`, sm: `${HEADER_HEIGHT.sm}px` },
          pb: { xs: '84px', md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          mr: { xs: 0, md: `${DRAWER_WIDTH}px` },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 700,
            py: { xs: 1.5, sm: 2.5 },
          }}
        >
          {children}
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
};

export default Layout;
