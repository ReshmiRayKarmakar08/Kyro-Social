import { Tabs, Tab, Box } from '@mui/material';
import { motion } from 'framer-motion';

const tabList = [
  { label: 'All Post', value: 'all' },
  { label: 'For You', value: 'forYou' },
  { label: 'Most Liked', value: 'mostLiked' },
  { label: 'Most Commented', value: 'mostCommented' },
];

const FeedTabs = ({ activeTab, onTabChange }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
        mb: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_, val) => onTabChange(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 52,
          px: 0.7,
          py: 0.35,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            minHeight: 40,
            borderRadius: '999px',
            mr: 0.7,
            color: '#9CA3AF',
            fontWeight: 700,
            fontSize: '0.8rem',
            textTransform: 'none',
            px: 1.8,
            '&.Mui-selected': {
              color: '#FFFFFF',
              bgcolor: '#FF6154',
            },
          },
        }}
      >
        {tabList.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} id={`feed-tab-${tab.value}`} />
        ))}
      </Tabs>
    </Box>
  );
};

export default FeedTabs;
