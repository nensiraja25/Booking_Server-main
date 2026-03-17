export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateFare = (distance) => {
  // Emergency-service pricing placeholder (industry-ready version would be dynamic by city/priority/SLA).
  const rateStructure = {
    AMBULANCE: { baseFare: 0, perKmRate: 0, minimumFare: 0 },
    FIRE_BRIGADE: { baseFare: 0, perKmRate: 0, minimumFare: 0 },
    ANIMAL_NGO: { baseFare: 0, perKmRate: 0, minimumFare: 0 },
  };

  const fareCalculation = (baseFare, perKmRate, minimumFare) => {
    const calculatedFare = baseFare + distance * perKmRate;
    return Math.max(calculatedFare, minimumFare);
  };

  return {
    AMBULANCE: fareCalculation(
      rateStructure.AMBULANCE.baseFare,
      rateStructure.AMBULANCE.perKmRate,
      rateStructure.AMBULANCE.minimumFare
    ),
    FIRE_BRIGADE: fareCalculation(
      rateStructure.FIRE_BRIGADE.baseFare,
      rateStructure.FIRE_BRIGADE.perKmRate,
      rateStructure.FIRE_BRIGADE.minimumFare
    ),
    ANIMAL_NGO: fareCalculation(
      rateStructure.ANIMAL_NGO.baseFare,
      rateStructure.ANIMAL_NGO.perKmRate,
      rateStructure.ANIMAL_NGO.minimumFare
    ),
  };
};

export const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
