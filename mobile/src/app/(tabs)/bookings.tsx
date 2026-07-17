import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/books/ledger";
import { brand } from "@/constants/brand";

type BookingRow = {
  id: string;
  booking_number: string;
  passenger_name: string;
  pickup_address: string;
  destination_address: string;
  ride_date: string;
  ride_time: string;
  booking_status: string;
  payment_status: string;
  amount_cents: number | null;
};

const STATUS_COLORS: Record<string, { fg: string; bg: string }> = {
  pending: { fg: brand.amber, bg: brand.amberBg },
  confirmed: { fg: "#1D4ED8", bg: "#EFF6FF" },
  in_progress: { fg: brand.secondary, bg: "#ECFEFF" },
  completed: { fg: brand.success, bg: brand.successBg },
  cancelled: { fg: brand.slate500, bg: brand.surface },
};

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("bookings")
      .select(
        "id, booking_number, passenger_name, pickup_address, destination_address, ride_date, ride_time, booking_status, payment_status, amount_cents",
      )
      .order("ride_date", { ascending: false })
      .limit(100);
    setBookings((data ?? []) as BookingRow[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: brand.surface }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={bookings}
      keyExtractor={(b) => b.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          tintColor={brand.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyBody}>
            Rides booked on rideaccessnyc.com appear here automatically.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const status =
          STATUS_COLORS[item.booking_status] ?? STATUS_COLORS.pending;
        return (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.bookingNumber}>{item.booking_number}</Text>
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Text style={[styles.badgeText, { color: status.fg }]}>
                  {item.booking_status.replace("_", " ")}
                </Text>
              </View>
            </View>
            <Text style={styles.passenger}>{item.passenger_name}</Text>
            <Text style={styles.route} numberOfLines={2}>
              {item.pickup_address} → {item.destination_address}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.meta}>
                {item.ride_date} · {item.ride_time}
              </Text>
              <Text style={styles.amount}>
                {item.amount_cents != null ? formatMoney(item.amount_cents) : "—"}
                <Text style={styles.meta}> · {item.payment_status.replace("_", " ")}</Text>
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: brand.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: brand.border,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingNumber: { fontSize: 12, fontWeight: "700", color: brand.slate500 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  passenger: { fontSize: 16, fontWeight: "700", color: brand.ink, marginTop: 6 },
  route: { fontSize: 13, color: brand.slate500, marginTop: 4 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  meta: { fontSize: 12, color: brand.slate400, fontWeight: "400" },
  amount: {
    fontSize: 14,
    fontWeight: "700",
    color: brand.ink,
    fontVariant: ["tabular-nums"],
  },
  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: brand.ink },
  emptyBody: {
    fontSize: 13,
    color: brand.slate500,
    textAlign: "center",
    marginTop: 6,
  },
});
