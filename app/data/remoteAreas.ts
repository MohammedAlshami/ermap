// Remote and externally served areas for Life Water Berhad

export interface RemoteArea {
  name: string;
  type: 'Remote_District' | 'External_Market';
  serviceModel: 'Interior_Direct_Low_Density' | '3PL_Domestic' | '3PL_Sarawak' | 'Low_Density_Eastern';
  lat: number;
  lon: number;
}

export const remoteAreas: RemoteArea[] = [
  {
    name: 'Nabawan',
    type: 'Remote_District',
    serviceModel: 'Interior_Direct_Low_Density',
    lat: 4.9376,
    lon: 116.5121,
  },
  {
    name: 'Sook',
    type: 'Remote_District',
    serviceModel: 'Interior_Direct_Low_Density',
    lat: 5.2866,
    lon: 116.5460,
  },
  {
    name: 'Keningau Remote',
    type: 'Remote_District',
    serviceModel: 'Interior_Direct_Low_Density',
    lat: 5.3302,
    lon: 116.1656,
  },
  {
    name: 'Paitan',
    type: 'Remote_District',
    serviceModel: 'Low_Density_Eastern',
    lat: 6.4635,
    lon: 117.2570,
  },
  {
    name: 'Labuan',
    type: 'External_Market',
    serviceModel: '3PL_Domestic',
    lat: 5.2767,
    lon: 115.2410,
  },
  {
    name: 'Limbang',
    type: 'External_Market',
    serviceModel: '3PL_Sarawak',
    lat: 4.7500,
    lon: 115.0005,
  },
  {
    name: 'Lawas',
    type: 'External_Market',
    serviceModel: '3PL_Sarawak',
    lat: 4.8614,
    lon: 115.4090,
  },
];

// Get color for service model
export const getServiceModelColor = (serviceModel: string): string => {
  switch (serviceModel) {
    case '3PL_Domestic':
      return '#E67E22'; // Muted amber
    case '3PL_Sarawak':
      return '#D35400'; // Soft red
    case 'Interior_Direct_Low_Density':
      return '#F39C12'; // Orange
    case 'Low_Density_Eastern':
      return '#F39C12'; // Orange
    default:
      return '#BDC3C7'; // Gray fallback
  }
};

// Get label text with service model indicator
export const getRemoteAreaLabel = (area: RemoteArea): string => {
  if (area.serviceModel.includes('3PL')) {
    return `${area.name}\n3PL`;
  }
  return `${area.name}\nLow Density`;
};



