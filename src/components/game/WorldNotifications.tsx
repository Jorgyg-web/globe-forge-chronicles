import { useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useGame } from '@/context/GameContext';

const WorldNotifications = () => {
  const { state } = useGame();
  const { toast } = useToast();
  const seenIdsRef = useRef<Set<string>>(new Set());

  const notifications = useMemo(() => {
    const player = state.countries[state.playerCountryId];
    if (!player) return [] as Array<{ id: string; title: string; description: string; variant?: 'default' | 'destructive' }>;

    const eventNotifications = [...state.events]
      .slice(-6)
      .map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        variant: event.type === 'war' ? 'destructive' as const : 'default' as const,
      }));

    const crisisNotifications = [
      player.resourceIncome.food < 0 || player.resources.food < 40
        ? {
            id: `notif_food_${state.turn}`,
            title: 'Starvation risk',
            description: `Food balance is ${player.resourceIncome.food >= 0 ? '+' : ''}${Math.round(player.resourceIncome.food)} per turn with reserves at ${Math.round(player.resources.food)}.`,
            variant: 'destructive' as const,
          }
        : null,
      Object.values(player.resourceIncome).some(value => value < 0)
        ? {
            id: `notif_deficit_${state.turn}`,
            title: 'Economic deficit',
            description: 'One or more strategic resources are trending negative.',
            variant: 'default' as const,
          }
        : null,
    ].filter((value): value is NonNullable<typeof value> => value !== null);

    return [...crisisNotifications, ...eventNotifications];
  }, [state]);

  useEffect(() => {
    for (const notification of notifications) {
      if (seenIdsRef.current.has(notification.id)) continue;
      seenIdsRef.current.add(notification.id);

      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.variant,
      });
    }
  }, [notifications, toast]);

  return null;
};

export default WorldNotifications;