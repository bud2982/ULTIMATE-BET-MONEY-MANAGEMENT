import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { dataSyncManager } from '@/lib/data-sync';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';

interface SyncStatus {
  lastSyncTimestamp: number | null;
  lastSyncDate: Date | null;
  pendingOperations: number;
  syncInProgress: boolean;
}

export function SyncStatus() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSyncTimestamp: null,
    lastSyncDate: null,
    pendingOperations: 0,
    syncInProgress: false
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update sync status
  const updateSyncStatus = () => {
    const status = dataSyncManager.getSyncStatus();
    setSyncStatus(status);
  };

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update sync status periodically
  useEffect(() => {
    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    await dataSyncManager.syncPendingOperations();
    updateSyncStatus();
  };

  const handleExportData = () => {
    const backup = dataSyncManager.exportLocalData();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `betting-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (syncStatus.syncInProgress) return 'default';
    if (syncStatus.pendingOperations > 0) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus.syncInProgress) return 'Sincronizzazione...';
    if (syncStatus.pendingOperations > 0) return `${syncStatus.pendingOperations} in attesa`;
    return 'Sincronizzato';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <CloudOff className="h-4 w-4" />;
    if (syncStatus.syncInProgress) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (syncStatus.pendingOperations > 0) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge 
          variant={getStatusColor()}
          className="cursor-pointer flex items-center gap-2 px-3 py-2"
          onClick={() => setIsExpanded(true)}
        >
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Stato Sincronizzazione</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <CardDescription className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Connessione</span>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Storage Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Storage</span>
            </div>
            <Badge variant="outline">
              Database + Local
            </Badge>
          </div>

          {/* Last Sync */}
          {syncStatus.lastSyncDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">Ultima sync</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {syncStatus.lastSyncDate.toLocaleTimeString()}
              </span>
            </div>
          )}

          {/* Pending Operations */}
          {syncStatus.pendingOperations > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-orange-500" />
                <span className="text-sm">In attesa</span>
              </div>
              <Badge variant="secondary">
                {syncStatus.pendingOperations}
              </Badge>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus.syncInProgress || !isOnline}
              className="flex-1"
            >
              {syncStatus.syncInProgress ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Sincronizza
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground">
            I dati sono salvati localmente e sincronizzati automaticamente quando possibile.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SyncStatus;