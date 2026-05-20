import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';

final supabase = Supabase.instance.client;

final onlineOrdersStreamProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  return supabase
      .from('online_orders')
      .stream(primaryKey: ['id'])
      .order('created_at', ascending: false);
});

class OnlineOrdersScreen extends ConsumerStatefulWidget {
  const OnlineOrdersScreen({super.key});

  @override
  ConsumerState<OnlineOrdersScreen> createState() => _OnlineOrdersScreenState();
}

class _OnlineOrdersScreenState extends ConsumerState<OnlineOrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AudioPlayer _audioPlayer = AudioPlayer();
  int _lastPendingCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _audioPlayer.dispose();
    super.dispose();
  }

  void _playSound() async {
    try {
      await _audioPlayer.play(AssetSource('sounds/ding.mp3'));
    } catch (e) {
      debugPrint('Error playing sound: $e');
    }
  }

  void _showOrderDetailSheet(Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => OnlineOrderDetailSheet(order: order),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ordersAsyncValue = ref.watch(onlineOrdersStreamProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Online Orders'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Pending'),
            Tab(text: 'Preparing'),
            Tab(text: 'Done'),
          ],
        ),
      ),
      body: ordersAsyncValue.when(
        data: (orders) {
          final pendingOrders = orders.where((o) => o['status'] == 'pending').toList();
          final preparingOrders = orders.where((o) => o['status'] == 'confirmed' || o['status'] == 'preparing' || o['status'] == 'out_for_delivery').toList();
          final doneOrders = orders.where((o) => o['status'] == 'delivered' || o['status'] == 'cancelled').toList();

          // Check for new pending orders
          if (pendingOrders.length > _lastPendingCount) {
            _playSound();
          }
          _lastPendingCount = pendingOrders.length;

          return TabBarView(
            controller: _tabController,
            children: [
              _buildOrderList(pendingOrders),
              _buildOrderList(preparingOrders),
              _buildOrderList(doneOrders),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildOrderList(List<Map<String, dynamic>> orders) {
    if (orders.isEmpty) {
      return const Center(child: Text('No orders found'));
    }

    return ListView.builder(
      itemCount: orders.length,
      padding: const EdgeInsets.all(8),
      itemBuilder: (context, index) {
        final order = orders[index];
        final createdAt = DateTime.parse(order['created_at']);
        final timeAgo = DateTime.now().difference(createdAt);
        String timeAgoStr = '';
        if (timeAgo.inMinutes < 60) {
          timeAgoStr = '${timeAgo.inMinutes}m ago';
        } else {
          timeAgoStr = '${timeAgo.inHours}h ago';
        }

        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
          child: InkWell(
            onTap: () => _showOrderDetailSheet(order),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        order['order_number'] ?? 'N/A',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          order['payment_method']?.toUpperCase() ?? 'COD',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${order['customer_name']} • ${order['customer_whatsapp']}',
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total: ৳${NumberFormat("#,##0").format(order['total'] ?? 0)}',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blue),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.access_time, size: 14, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(timeAgoStr, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                  if (order['status'] == 'pending') ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                            onPressed: () => _updateStatus(order['id'], 'confirmed'),
                            icon: const Icon(Icons.check),
                            label: const Text('Accept'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                            onPressed: () => _showRejectDialog(order['id']),
                            icon: const Icon(Icons.close),
                            label: const Text('Reject'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _updateStatus(String orderId, String status, {String? reason}) async {
    try {
      await supabase.rpc('update_online_order_status', params: {
        'p_order_id': orderId,
        'p_new_status': status,
        'p_reason': reason,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order marked as $status')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _showRejectDialog(String orderId) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Reject Order'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('No stock available'),
                onTap: () {
                  Navigator.pop(context);
                  _updateStatus(orderId, 'cancelled', reason: 'No stock available');
                },
              ),
              ListTile(
                title: const Text('Address unclear / outside zone'),
                onTap: () {
                  Navigator.pop(context);
                  _updateStatus(orderId, 'cancelled', reason: 'Address unclear / outside zone');
                },
              ),
              ListTile(
                title: const Text('Store closed'),
                onTap: () {
                  Navigator.pop(context);
                  _updateStatus(orderId, 'cancelled', reason: 'Store closed');
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class OnlineOrderDetailSheet extends StatefulWidget {
  final Map<String, dynamic> order;

  const OnlineOrderDetailSheet({super.key, required this.order});

  @override
  State<OnlineOrderDetailSheet> createState() => _OnlineOrderDetailSheetState();
}

class _OnlineOrderDetailSheetState extends State<OnlineOrderDetailSheet> {
  List<dynamic> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchItems();
  }

  Future<void> _fetchItems() async {
    try {
      final res = await supabase
          .from('online_order_items')
          .select('*, products(name_en, name_bn)')
          .eq('order_id', widget.order['id']);
      setState(() {
        _items = res;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  void _updateStatus(String status) async {
    try {
      await supabase.rpc('update_online_order_status', params: {
        'p_order_id': widget.order['id'],
        'p_new_status': status,
        'p_reason': null,
      });
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order marked as $status')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _openWhatsApp() async {
    final status = widget.order['status'];
    String message = '';
    
    if (status == 'confirmed') {
      message = '✓ আপনার অর্ডার #${widget.order['order_number']} নিশ্চিত হয়েছে। ৩০-৪৫ মিনিটের মধ্যে পৌঁছাবে।';
    } else if (status == 'out_for_delivery') {
      message = '🛵 আপনার অর্ডার #${widget.order['order_number']} রাস্তায়। কিছুক্ষণের মধ্যে পৌঁছাবে।';
    } else if (status == 'delivered') {
      message = '✓ ডেলিভারি সম্পন্ন! Lucky Store থেকে অর্ডার করার জন্য ধন্যবাদ।';
    } else if (status == 'cancelled') {
      message = 'দুঃখিত, আপনার অর্ডার #${widget.order['order_number']} বাতিল হয়েছে। কারণ: ${widget.order['cancellation_reason'] ?? ''}';
    } else {
      message = 'Order #${widget.order['order_number']} query';
    }

    String phone = widget.order['customer_whatsapp'].toString().replaceAll(RegExp(r'^0+'), '');
    final url = Uri.parse('https://wa.me/88$phone?text=${Uri.encodeComponent(message)}');
    
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch WhatsApp')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Order Details',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(),
          Text('Customer: ${widget.order['customer_name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
          Text('WhatsApp: ${widget.order['customer_whatsapp']}'),
          Text('Address: ${widget.order['customer_address']}'),
          const SizedBox(height: 16),
          const Text('Items:', style: TextStyle(fontWeight: FontWeight.bold)),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_items.isEmpty)
            const Text('No items found')
          else
            ..._items.map((item) {
              final productName = item['products']?['name_en'] ?? 'Unknown Product';
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text('${item['quantity']}x $productName')),
                    Text('৳${NumberFormat("#,##0").format(item['total_price'])}'),
                  ],
                ),
              );
            }),
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal:'),
              Text('৳${NumberFormat("#,##0").format(widget.order['subtotal'] ?? 0)}'),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Delivery Fee:'),
              Text('৳${NumberFormat("#,##0").format(widget.order['delivery_fee'] ?? 0)}'),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              Text('৳${NumberFormat("#,##0").format(widget.order['total'] ?? 0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue)),
            ],
          ),
          const SizedBox(height: 20),
          
          if (widget.order['status'] != 'pending' && widget.order['status'] != 'cancelled' && widget.order['status'] != 'delivered')
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (widget.order['status'] == 'confirmed')
                  ElevatedButton(
                    onPressed: () => _updateStatus('preparing'),
                    child: const Text('Mark Preparing'),
                  ),
                if (widget.order['status'] == 'preparing')
                  ElevatedButton(
                    onPressed: () => _updateStatus('out_for_delivery'),
                    child: const Text('Out for Delivery'),
                  ),
                if (widget.order['status'] == 'out_for_delivery')
                  ElevatedButton(
                    onPressed: () => _updateStatus('delivered'),
                    child: const Text('Mark Delivered'),
                  ),
              ],
            ),
            
          const SizedBox(height: 12),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF25D366), foregroundColor: Colors.white),
            onPressed: _openWhatsApp,
            icon: const Icon(Icons.message),
            label: const Text('WhatsApp Customer'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
