import { Box } from '@mui/material';
import Header from './Header';
import Sidebar, { DRAWER_WIDTH } from './Sidebar';
import BottomNav from './BottomNav';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F5F7' }}>
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: '56px', sm: '64px' },
          pb: { xs: '76px', md: 3 },
          px: { xs: 1, sm: 2, md: 3 },
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },
          maxWidth: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Box
          sx={{
            maxWidth: 680,
            mx: 'auto',
            width: '100%',
            py: 2,
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
