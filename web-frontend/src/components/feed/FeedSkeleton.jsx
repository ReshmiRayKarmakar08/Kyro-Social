import { Card, CardContent, Box, Skeleton } from '@mui/material';

const PostCardSkeleton = () => {
  return (
    <Card sx={{ mb: 2, overflow: 'visible' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2 } }}>
        {/* Author Row */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Skeleton variant="circular" width={42} height={42} animation="wave" />
          <Box sx={{ ml: 1.5, flex: 1 }}>
            <Skeleton variant="text" width="40%" height={20} animation="wave" />
            <Skeleton variant="text" width="25%" height={16} animation="wave" />
          </Box>
          <Skeleton variant="rounded" width={72} height={30} sx={{ borderRadius: 50 }} animation="wave" />
        </Box>

        {/* Content */}
        <Skeleton variant="text" width="100%" height={18} animation="wave" />
        <Skeleton variant="text" width="90%" height={18} animation="wave" />
        <Skeleton variant="text" width="60%" height={18} animation="wave" sx={{ mb: 1.5 }} />

        {/* Image placeholder */}
        <Skeleton
          variant="rounded"
          width="100%"
          height={220}
          sx={{ borderRadius: 3, mb: 1.5 }}
          animation="wave"
        />

        {/* Action Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={28} height={28} animation="wave" />
            <Skeleton variant="text" width={20} height={16} animation="wave" />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Skeleton variant="circular" width={28} height={28} animation="wave" />
            <Skeleton variant="text" width={20} height={16} animation="wave" />
          </Box>
          <Skeleton variant="circular" width={28} height={28} animation="wave" />
          <Box sx={{ ml: 'auto' }}>
            <Skeleton variant="circular" width={28} height={28} animation="wave" />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const FeedSkeleton = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </>
  );
};

export { PostCardSkeleton };
export default FeedSkeleton;
