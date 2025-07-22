import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone, Tablet, MoreVertical, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Device {
  id: number;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  lastAccess: string;
  userAgent: string;
  active: boolean;
}

export default function DeviceManager() {
  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["/api/devices"],
    retry: false,
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-6 w-6 text-blue-600" />;
      case 'tablet':
        return <Tablet className="h-6 w-6 text-green-600" />;
      default:
        return <Monitor className="h-6 w-6 text-purple-600" />;
    }
  };

  const formatLastAccess = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Ora';
    if (diffInHours < 24) return `${diffInHours}h fa`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}g fa`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Dispositivi Autorizzati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Dispositivi Autorizzati
        </CardTitle>
        <CardDescription>
          Accesso multi-dispositivo attivo. Puoi usare l'app su tutti i tuoi dispositivi personali.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {devices && Array.isArray(devices) && devices.length > 0 ? (
          devices.map((device: Device) => (
            <div 
              key={device.id} 
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{device.name}</h4>
                  <p className="text-sm text-gray-500">
                    Ultimo accesso: {formatLastAccess(device.lastAccess)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {device.active && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Attivo
                  </Badge>
                )}
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nessun dispositivo registrato</p>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <h4 className="font-medium text-blue-900">Accesso Multi-Dispositivo Attivo</h4>
              <p className="text-sm text-blue-700">
                Puoi accedere contemporaneamente da computer, tablet e smartphone con lo stesso account.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}