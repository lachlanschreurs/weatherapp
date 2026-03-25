interface DayData {
  date: Date;
  tempMax: number;
  tempMin: number;
  humidity: number;
  windSpeed: number;
  rain: number;
  weather: string;
}

export interface PlantingDay {
  date: string;
  dayName: string;
  rating: 'Excellent' | 'Good' | 'Fair';
  reasons: string[];
}

export interface IrrigationDay {
  date: string;
  dayName: string;
  level: 'High' | 'Medium' | 'Low' | 'None';
  recommendation: string;
  rainAmount: number;
}

export function analyzePlantingDays(dailyData: DayData[]): PlantingDay[] {
  const plantingDays: PlantingDay[] = [];

  dailyData.forEach((day, index) => {
    const reasons: string[] = [];
    let score = 0;

    const tempIdeal = day.tempMax >= 15 && day.tempMax <= 28;
    if (tempIdeal) {
      score += 3;
      reasons.push('Ideal temperature range');
    } else if (day.tempMax >= 10 && day.tempMax <= 32) {
      score += 1;
      reasons.push('Acceptable temperature');
    }

    if (day.rain < 2) {
      score += 2;
      reasons.push('Minimal rainfall');
    } else if (day.rain < 5) {
      score += 1;
    }

    const nextDayData = dailyData[index + 1];
    if (nextDayData) {
      if (nextDayData.rain < 10) {
        score += 2;
        reasons.push('Good weather ahead');
      }
    }

    if (day.windSpeed < 20) {
      score += 1;
      reasons.push('Low wind conditions');
    }

    if (day.humidity >= 40 && day.humidity <= 70) {
      score += 1;
      reasons.push('Good soil moisture conditions');
    }

    let rating: 'Excellent' | 'Good' | 'Fair' | null = null;
    if (score >= 7) {
      rating = 'Excellent';
    } else if (score >= 5) {
      rating = 'Good';
    } else if (score >= 3) {
      rating = 'Fair';
    }

    if (rating) {
      const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      plantingDays.push({
        date: dateStr,
        dayName,
        rating,
        reasons: reasons.slice(0, 3),
      });
    }
  });

  return plantingDays.slice(0, 5);
}

export function analyzeIrrigationNeeds(dailyData: DayData[]): IrrigationDay[] {
  const irrigationDays: IrrigationDay[] = [];

  dailyData.forEach((day) => {
    const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let level: 'High' | 'Medium' | 'Low' | 'None';
    let recommendation: string;

    if (day.rain >= 10) {
      level = 'None';
      recommendation = 'Heavy rain expected - no irrigation needed';
    } else if (day.rain >= 5) {
      level = 'Low';
      recommendation = 'Moderate rain expected - minimal irrigation';
    } else if (day.rain >= 2) {
      level = 'Medium';
      recommendation = 'Light rain expected - reduce irrigation';
    } else {
      if (day.tempMax > 28 || day.humidity < 40) {
        level = 'High';
        recommendation = 'Dry conditions - increase irrigation';
      } else if (day.tempMax > 25) {
        level = 'Medium';
        recommendation = 'Warm and dry - normal irrigation';
      } else {
        level = 'Low';
        recommendation = 'Mild conditions - light irrigation';
      }
    }

    irrigationDays.push({
      date: dateStr,
      dayName,
      level,
      recommendation,
      rainAmount: day.rain,
    });
  });

  return irrigationDays;
}
