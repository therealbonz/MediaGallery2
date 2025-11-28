import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';
import { Download, Wifi, WifiOff, X } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, installApp, dismissInstall } = usePWA();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border rounded-lg shadow-lg p-4 z-50" data-testid="install-prompt">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">Install Media Gallery</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add to your home screen for quick access and offline viewing
          </p>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={installApp}
              data-testid="button-install-app"
            >
              Install
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={dismissInstall}
              data-testid="button-dismiss-install"
            >
              Not now
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          onClick={dismissInstall}
          data-testid="button-close-install"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function OfflineNotice() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-500 text-amber-950 py-2 px-4 flex items-center justify-center gap-2 z-50" data-testid="offline-notice">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
    </div>
  );
}

export function OnlineIndicator() {
  const { isOnline } = usePWA();

  return (
    <div className="flex items-center gap-1.5 text-xs" data-testid="online-indicator">
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5 text-green-500" />
          <span className="text-muted-foreground">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-amber-500">Offline</span>
        </>
      )}
    </div>
  );
}

export function InstallButton() {
  const { isInstallable, isInstalled, installApp } = usePWA();

  if (isInstalled) {
    return (
      <Button variant="outline" size="sm" disabled data-testid="button-installed">
        <Download className="h-4 w-4 mr-2" />
        Installed
      </Button>
    );
  }

  if (!isInstallable) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={installApp}
      data-testid="button-install-header"
    >
      <Download className="h-4 w-4 mr-2" />
      Install App
    </Button>
  );
}
