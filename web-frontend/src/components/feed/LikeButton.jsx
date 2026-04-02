import { motion } from 'framer-motion';
import { IconButton, useTheme } from '@mui/material';
import { FavoriteBorderRounded, FavoriteRounded } from '@mui/icons-material';

const LikeButton = ({ liked, count, onToggle }) => {
  const theme = useTheme();
  const inactiveColor = theme.palette.text.secondary;

  return (
    <motion.div
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      whileTap={{ scale: 0.75 }}
    >
      <IconButton
        onClick={onToggle}
        size="small"
        sx={{
          color: liked ? '#EF4444' : inactiveColor,
          transition: 'color 0.15s ease',
        }}
        id="like-button"
      >
        {liked ? (
          <motion.div
            key="liked"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.4, 1] }}
            transition={{ duration: 0.35, ease: [0.175, 0.885, 0.32, 1.275] }}
          >
            <FavoriteRounded sx={{ fontSize: 22 }} />
          </motion.div>
        ) : (
          <FavoriteBorderRounded sx={{ fontSize: 22 }} />
        )}
      </IconButton>
      <motion.span
        key={count}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: '0.82rem',
          fontWeight: 600,
          color: liked ? '#EF4444' : inactiveColor,
          userSelect: 'none',
        }}
      >
        {count || ''}
      </motion.span>
    </motion.div>
  );
};

export default LikeButton;
