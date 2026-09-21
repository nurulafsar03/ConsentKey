import { useEffect, useState } from 'react';
import { appInstaller, BeforeInstallPromptEvent } from '../services/appInstaller';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    appInstaller.getDeferredPrompt()
  );
  const [isInstalled, setIsInstalled] = useState(appInstaller.isInstalled());
  const [isIOS, setIsIOS] = useState(appInstaller.isIOS());

  useEffect(() => {
    setIsInstalled(appInstaller.isInstalled());
    setIsIOS(appInstaller.isIOS());

    const unsubscribe = appInstaller.subscribeToPrompt((prompt) => {
      setDeferredPrompt(prompt);
    });

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      unsubscribe();
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const res = await appInstaller.triggerManualAdminDownload();
    if (res.installed) {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  const triggerAutoMemberInstall = async () => {
    return await appInstaller.triggerAutomaticMemberDownload();
  };

  const triggerManualAdminInstall = async () => {
    return await appInstaller.triggerManualAdminDownload();
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
    triggerAutoMemberInstall,
    triggerManualAdminInstall,
  };
}

