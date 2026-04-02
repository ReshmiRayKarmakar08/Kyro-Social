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
          minHeight: 48,
          '& .MuiTab-root': {
            minHeight: 48,
            color: '#9CA3AF',
            fontWeight: 600,
            fontSize: '0.85rem',
            textTransform: 'none',
            '&.Mui-selected': {
              color: '#FF6154',
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
