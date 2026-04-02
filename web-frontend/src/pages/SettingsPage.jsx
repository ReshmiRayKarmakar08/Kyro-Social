import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Select,
  MenuItem,
  TextField,
  Chip,
  Button,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  PersonOutlineRounded,
  InsightsRounded,
  NotificationsNoneRounded,
  LockOutlined,
  GroupOutlined,
  BlockRounded,
  ChatBubbleOutlineRounded,
  AlternateEmailRounded,
  CommentOutlined,
  VisibilityOffOutlined,
  VolumeOffRounded,
  PaletteOutlined,
  LanguageRounded,
  AccessibilityNewRounded,
  DownloadRounded,
  HelpOutlineRounded,
  LogoutRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const defaultSettings = {
  privacy: {
    isPrivateAccount: false,
    allowTagsFrom: 'everyone',
    allowMentionsFrom: 'everyone',
  },
  interactions: {
    allowCommentsFrom: 'everyone',
    showLikeCounts: true,
    allowMessageRequests: true,
  },
  safety: {
    hiddenWordsEnabled: false,
    hiddenWords: [],
    restrictedUsernames: [],
    blockedUsernames: [],
    mutedUsernames: [],
  },
  app: {
    language: 'en',
    appearance: 'light',
    reducedMotion: false,
  },
  notifications: {
    likes: true,
    comments: true,
    follows: true,
    messages: true,
  },
};

const listSummary = (arr) => `${Array.isArray(arr) ? arr.length : 0} accounts`;

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(defaultSettings);
  const [hiddenWordsInput, setHiddenWordsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  const mergeState = (base, partial) => ({
    ...base,
    ...partial,
    privacy: { ...base.privacy, ...(partial?.privacy || {}) },
    interactions: { ...base.interactions, ...(partial?.interactions || {}) },
    safety: { ...base.safety, ...(partial?.safety || {}) },
    app: { ...base.app, ...(partial?.app || {}) },
    notifications: { ...base.notifications, ...(partial?.notifications || {}) },
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/settings');
        const merged = mergeState(defaultSettings, res.data.settings || {});
        setSettings(merged);
        setHiddenWordsInput((merged.safety.hiddenWords || []).join(', '));
      } catch {
        setSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const savePartial = async (partial, successMessage = 'Saved') => {
    setSaving(true);
    try {
      const next = mergeState(settings, partial);
      setSettings(next);
      await api.put('/users/settings', partial);
      setAlert({ open: true, message: successMessage, severity: 'success' });
    } catch (err) {
      setAlert({ open: true, message: err.response?.data?.message || 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const sectionTitle = (title) => (
    <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 700, px: 0.5, letterSpacing: '0.03em' }}>
      {title}
    </Typography>
  );

  const selectOptions = [
    { value: 'everyone', label: 'Everyone' },
    { value: 'followers', label: 'Followers only' },
    { value: 'no_one', label: 'No one' },
  ];

  if (!user) {
    return (
      <Card sx={{ borderRadius: 3, p: 3 }}>
        <Typography variant="h6" fontWeight={800}>Please sign in to view settings</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/auth')}>Go to Auth</Button>
      </Card>
    );
  }

  return (
    <Box sx={{ pb: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.8, letterSpacing: '-0.02em' }}>
        Settings and privacy
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage your account, privacy, interactions, and app preferences.
      </Typography>

      <Card sx={{ borderRadius: 3, p: 2, mb: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography fontWeight={800}>Account Center</Typography>
            <Typography variant="body2" color="text.secondary">Profile and security settings for @{user.username}</Typography>
          </Box>
          <Chip label={saving ? 'Saving...' : 'Live Sync'} color={saving ? 'warning' : 'success'} size="small" />
        </Stack>
      </Card>

      <Card sx={{ borderRadius: 3, p: 1.2, border: '1px solid rgba(0,0,0,0.06)' }}>
        <List sx={{ p: 0 }}>
          <ListItem button onClick={() => navigate(`/profile/${user.username}`)}>
            <ListItemIcon><PersonOutlineRounded /></ListItemIcon>
            <ListItemText primary="Edit profile" secondary="Name, bio, avatar, website" />
          </ListItem>
          <ListItem button onClick={() => navigate('/')}>
            <ListItemIcon><InsightsRounded /></ListItemIcon>
            <ListItemText primary="Your activity" secondary="Posts, likes and comments" />
          </ListItem>
          <ListItem button onClick={() => navigate('/notifications')}>
            <ListItemIcon><NotificationsNoneRounded /></ListItemIcon>
            <ListItemText primary="Notifications" secondary="Manage push and in-app alerts" />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.2 }} />
        {sectionTitle('Who can see your content')}

        <List sx={{ p: 0 }}>
          <ListItem
            secondaryAction={
              <Switch
                checked={settings.privacy.isPrivateAccount}
                onChange={(e) => savePartial({ privacy: { isPrivateAccount: e.target.checked } }, 'Privacy updated')}
              />
            }
          >
            <ListItemIcon><LockOutlined /></ListItemIcon>
            <ListItemText primary="Private account" secondary="Only approved followers can see your content" />
          </ListItem>
          <ListItem>
            <ListItemIcon><AlternateEmailRounded /></ListItemIcon>
            <ListItemText primary="Tags" />
            <Select
              size="small"
              value={settings.privacy.allowTagsFrom}
              onChange={(e) => savePartial({ privacy: { allowTagsFrom: e.target.value } }, 'Tag settings updated')}
            >
              {selectOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </ListItem>
          <ListItem>
            <ListItemIcon><GroupOutlined /></ListItemIcon>
            <ListItemText primary="Mentions" />
            <Select
              size="small"
              value={settings.privacy.allowMentionsFrom}
              onChange={(e) => savePartial({ privacy: { allowMentionsFrom: e.target.value } }, 'Mention settings updated')}
            >
              {selectOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </ListItem>
        </List>

        <Divider sx={{ my: 1.2 }} />
        {sectionTitle('How others can interact with you')}

        <List sx={{ p: 0 }}>
          <ListItem>
            <ListItemIcon><CommentOutlined /></ListItemIcon>
            <ListItemText primary="Comments" />
            <Select
              size="small"
              value={settings.interactions.allowCommentsFrom}
              onChange={(e) => savePartial({ interactions: { allowCommentsFrom: e.target.value } }, 'Comment settings updated')}
            >
              {selectOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={settings.interactions.showLikeCounts}
                onChange={(e) => savePartial({ interactions: { showLikeCounts: e.target.checked } }, 'Like count preference updated')}
              />
            }
          >
            <ListItemIcon><VisibilityOffOutlined /></ListItemIcon>
            <ListItemText primary="Show like counts" secondary="Disable to hide like counts on posts" />
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={settings.interactions.allowMessageRequests}
                onChange={(e) => savePartial({ interactions: { allowMessageRequests: e.target.checked } }, 'Message request preference updated')}
              />
            }
          >
            <ListItemIcon><ChatBubbleOutlineRounded /></ListItemIcon>
            <ListItemText primary="Message requests" secondary="Allow new DM requests from other users" />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.2 }} />
        {sectionTitle('Safety')}

        <List sx={{ p: 0 }}>
          <ListItem
            secondaryAction={
              <Switch
                checked={settings.safety.hiddenWordsEnabled}
                onChange={(e) => savePartial({ safety: { hiddenWordsEnabled: e.target.checked } }, 'Hidden words toggle updated')}
              />
            }
          >
            <ListItemIcon><BlockRounded /></ListItemIcon>
            <ListItemText primary="Hidden words" secondary="Filter replies and messages with selected words" />
          </ListItem>
          <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
            <TextField
              size="small"
              label="Hidden words (comma separated)"
              value={hiddenWordsInput}
              onChange={(e) => setHiddenWordsInput(e.target.value)}
              disabled={!settings.safety.hiddenWordsEnabled}
              fullWidth
            />
            <Button
              size="small"
              variant="outlined"
              disabled={!settings.safety.hiddenWordsEnabled}
              onClick={() => {
                const words = hiddenWordsInput.split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
                savePartial({ safety: { hiddenWords: words } }, 'Hidden words updated');
              }}
            >
              Save Hidden Words
            </Button>
          </ListItem>
          <ListItem>
            <ListItemIcon><BlockRounded /></ListItemIcon>
            <ListItemText primary="Blocked accounts" secondary={listSummary(settings.safety.blockedUsernames)} />
          </ListItem>
          <ListItem>
            <ListItemIcon><VolumeOffRounded /></ListItemIcon>
            <ListItemText primary="Muted accounts" secondary={listSummary(settings.safety.mutedUsernames)} />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.2 }} />
        {sectionTitle('Your app and media')}

        <List sx={{ p: 0 }}>
          <ListItem>
            <ListItemIcon><PaletteOutlined /></ListItemIcon>
            <ListItemText primary="Switch appearance" />
            <Select
              size="small"
              value={settings.app.appearance}
              onChange={(e) => savePartial({ app: { appearance: e.target.value } }, 'Appearance updated')}
            >
              <MenuItem value="system">System</MenuItem>
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </ListItem>
          <ListItem>
            <ListItemIcon><LanguageRounded /></ListItemIcon>
            <ListItemText primary="Language" />
            <Select
              size="small"
              value={settings.app.language}
              onChange={(e) => savePartial({ app: { language: e.target.value } }, 'Language updated')}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="hi">Hindi</MenuItem>
              <MenuItem value="bn">Bengali</MenuItem>
            </Select>
          </ListItem>
          <ListItem
            secondaryAction={
              <Switch
                checked={settings.app.reducedMotion}
                onChange={(e) => savePartial({ app: { reducedMotion: e.target.checked } }, 'Motion preference updated')}
              />
            }
          >
            <ListItemIcon><AccessibilityNewRounded /></ListItemIcon>
            <ListItemText primary="Reduced motion" secondary="Reduce motion effects across the app" />
          </ListItem>
          <ListItem button onClick={() => setAlert({ open: true, message: 'Archive export request submitted.', severity: 'success' })}>
            <ListItemIcon><DownloadRounded /></ListItemIcon>
            <ListItemText primary="Archiving and downloading" secondary="Request your data export" />
          </ListItem>
        </List>

        <Divider sx={{ my: 1.2 }} />
        {sectionTitle('More info and support')}

        <List sx={{ p: 0 }}>
          <ListItem button>
            <ListItemIcon><HelpOutlineRounded /></ListItemIcon>
            <ListItemText primary="Help" secondary="Visit help and support center" />
          </ListItem>
          <ListItem button onClick={() => { logout(); navigate('/auth'); }}>
            <ListItemIcon><LogoutRounded color="error" /></ListItemIcon>
            <ListItemText
              primary="Log out"
              primaryTypographyProps={{ color: 'error.main', fontWeight: 700 }}
            />
          </ListItem>
        </List>
      </Card>

      {loading && <Alert severity="info" sx={{ mt: 1.5 }}>Loading settings...</Alert>}

      <Snackbar
        open={alert.open}
        autoHideDuration={2500}
        onClose={() => setAlert((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={alert.severity} variant="filled" sx={{ borderRadius: 3 }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;
