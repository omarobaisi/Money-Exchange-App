import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalanceWallet as WalletIcon,
  SwapHoriz as TransactionsIcon,
  People as ClientsIcon,
  Payments as EarningsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const drawerWidth = 240;
const collapsedDrawerWidth = 65;

const menuItems = [
  { text: "لوحة التحكم", icon: <DashboardIcon />, path: "/" },
  { text: "الحساب الشخصي", icon: <WalletIcon />, path: "/profile" },
  { text: "المعاملات", icon: <TransactionsIcon />, path: "/transactions" },
  { text: "العملاء", icon: <ClientsIcon />, path: "/clients" },
  { text: "الأرباح", icon: <EarningsIcon />, path: "/earnings" },
  { text: "الإعدادات", icon: <SettingsIcon />, path: "/settings" },
];

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1,
          px: 1,
        }}
      >
        {drawerOpen && (
          <Typography variant="h6" component="div" className="arabic-text">
            تطبيق صرافة
          </Typography>
        )}
        <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
          {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? "initial" : "center",
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : "auto",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {drawerOpen && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ className: "arabic-text" }}
                />
              )}
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: {
            sm: `calc(100% - ${
              drawerOpen ? drawerWidth : collapsedDrawerWidth
            }px)`,
          },
          mr: { sm: `${drawerOpen ? drawerWidth : collapsedDrawerWidth}px` },
          transition: "width 0.2s, margin 0.2s",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ ml: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text ||
              ""}
          </Typography>

          <Tooltip title="الإعدادات الشخصية">
            <IconButton
              onClick={handleMenuOpen}
              size="small"
              sx={{ p: 0.5 }}
              aria-controls="user-menu"
              aria-haspopup="true"
            >
              <Avatar alt={currentUser?.name || "User"} />
            </IconButton>
          </Tooltip>

          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          >
            <MenuItem
              onClick={() => {
                handleMenuClose();
                navigate("/profile");
              }}
            >
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <Typography className="arabic-text">الملف الشخصي</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography className="arabic-text">تسجيل الخروج</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { sm: drawerOpen ? drawerWidth : collapsedDrawerWidth },
          flexShrink: { sm: 0 },
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: (theme) => theme.zIndex.drawer,
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          anchor="right"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          anchor="right"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
              transition: "width 0.2s",
              overflowX: "hidden",
              borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
              position: "fixed",
              height: "100%",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: {
            sm: `calc(100% - ${
              drawerOpen ? drawerWidth : collapsedDrawerWidth
            }px)`,
          },
          mt: 8,
          transition: "width 0.2s",
          ml: "auto",
          mr: { sm: `${drawerOpen ? drawerWidth : collapsedDrawerWidth}px` },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
