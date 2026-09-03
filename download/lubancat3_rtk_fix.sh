#!/bin/bash
# ============================================================================
# LubanCat-3 (RK3576) RTL8851BU WiFi+BT 一键安装脚本
# ============================================================================
# 适用环境: LubanCat-3 / RK3576 / Ubuntu 22.04 / Kernel 6.1.99-rk3576
# 目标芯片: Realtek RTL8851BU (WiFi 6 + BT 5.3 combo)
# USB ID:   0bda:1a2b (CDROM) -> 0bda:b851 (WiFi+BT)
#
# 用法:
#   chmod +x lubancat3_rtk_fix.sh
#   sudo ./lubancat3_rtk_fix.sh [源码目录]
#
# 源码目录默认为脚本所在目录下的 Linux/
# ============================================================================

set -e

# ── 颜色输出 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERR]${NC} $*"; exit 1; }

# ── 权限检查 ──
[ "$(id -u)" -ne 0 ] && err "请使用 sudo 运行此脚本"

# ── 路径设置 ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SRC_DIR="${1:-$SCRIPT_DIR/Linux}"
WIFI_SRC="$SRC_DIR/WIFI"
BT_SRC="$SRC_DIR/BT"
KERNEL_VER="$(uname -r)"

echo ""
echo "=========================================="
echo " RTL8851BU WiFi+BT 一键安装脚本"
echo "=========================================="
echo ""
info "内核版本: $KERNEL_VER"
info "源码目录: $SRC_DIR"
echo ""

# ── 检查源码目录 ──
[ -d "$WIFI_SRC" ] || err "WiFi 源码目录不存在: $WIFI_SRC"
[ -d "$BT_SRC" ]   || err "BT 源码目录不存在: $BT_SRC"
[ -f "$WIFI_SRC/Makefile" ] || err "WiFi Makefile 不存在"

# ── 安装依赖 ──
info "安装编译依赖..."
apt-get update -qq
apt-get install -y -qq build-essential linux-headers-$(uname -r) python3-usb > /dev/null 2>&1
ok "依赖安装完成"

# ============================================================================
# 步骤 1: 修复 WiFi 驱动源码 bug
# ============================================================================
echo ""
info "步骤 1/6: 修复 WiFi 驱动源码编译 bug..."

REG_FILE="$WIFI_SRC/phl/phl_regulation_def.h"
if [ -f "$REG_FILE" ]; then
    # 检查是否已经修复过
    if grep -q 'sizeof(struct regulatory_domain_mapping_6g)' "$REG_FILE"; then
        # 只修复第 114 行附近的 PHL_GET_CHDEF_6G 宏
        # 该宏中 sizeof 使用了错误的结构体类型，应为 struct chdef_6ghz
        # 注意: 第 122 行 PHL_GET_DOMAIN_INDEX_6G 宏中的写法是正确的，不能改
        sed -i '/PHL_GET_CHDEF_6G/,/;/ s/sizeof(struct regulatory_domain_mapping_6g)/sizeof(struct chdef_6ghz)/' "$REG_FILE"
        ok "已修复 phl_regulation_def.h 中 PHL_GET_CHDEF_6G 宏的 sizeof 错误"
    else
        warn "源码已修复过，跳过"
    fi
else
    err "找不到 $REG_FILE"
fi

# ============================================================================
# 步骤 2: 编译 WiFi 驱动
# ============================================================================
echo ""
info "步骤 2/6: 编译 WiFi 驱动 (8851bu)..."
info "  (需要约 10 分钟，请耐心等待)"

cd "$WIFI_SRC"
make clean > /dev/null 2>&1 || true
make all ARCH=arm64 -j$(nproc) 2>&1 | tail -5

if [ -f "$WIFI_SRC/8851bu.ko" ]; then
    ok "WiFi 驱动编译成功: 8851bu.ko ($(du -h 8851bu.ko | cut -f1))"
else
    err "WiFi 驱动编译失败，请检查上方错误信息"
fi

# ============================================================================
# 步骤 3: 安装 WiFi 驱动
# ============================================================================
echo ""
info "步骤 3/6: 安装 WiFi 驱动..."

cp "$WIFI_SRC/8851bu.ko" "/lib/modules/$KERNEL_VER/kernel/drivers/net/wireless/"
depmod -a
ok "WiFi 驱动已安装到 /lib/modules/$KERNEL_VER/kernel/drivers/net/wireless/"

# ============================================================================
# 步骤 4: 编译安装蓝牙驱动
# ============================================================================
echo ""
info "步骤 4/6: 编译安装蓝牙驱动 (rtk_btusb)..."

# 复制固件
FW_DIR="$BT_SRC/rtkbt-firmware/lib/firmware"
if [ -d "$FW_DIR" ]; then
    cp "$FW_DIR"/rtl8851bu_* /lib/firmware/ 2>/dev/null || true
    ok "蓝牙固件已复制到 /lib/firmware/"
else
    warn "蓝牙固件目录不存在，跳过固件复制"
fi

# 编译蓝牙驱动
BT_USB_DIR="$BT_SRC/usb"
if [ -d "$BT_USB_DIR" ] && [ -f "$BT_USB_DIR/Makefile" ]; then
    cd "$BT_USB_DIR"
    make clean > /dev/null 2>&1 || true
    make all ARCH=arm64 2>&1 | tail -3

    if [ -f "$BT_USB_DIR/rtk_btusb.ko" ]; then
        cp "$BT_USB_DIR/rtk_btusb.ko" "/lib/modules/$KERNEL_VER/kernel/drivers/bluetooth/"
        depmod -a
        ok "蓝牙驱动编译安装成功: rtk_btusb.ko"
    else
        warn "蓝牙驱动编译失败，蓝牙功能可能不可用"
    fi
else
    warn "蓝牙 USB 驱动目录不存在，跳过"
fi

# ============================================================================
# 步骤 5: USB 模式切换
# ============================================================================
echo ""
info "步骤 5/6: USB 模式切换 (CDROM -> WiFi+BT)..."

# 检查当前 USB 状态
CURRENT_ID=$(lsusb -d 0bda: 2>/dev/null | head -1)
if echo "$CURRENT_ID" | grep -q "1a2b"; then
    info "检测到设备处于 CDROM 模式 (0bda:1a2b)，执行切换..."

    # 创建 Python 切换脚本
    SWITCH_SCRIPT=$(mktemp /tmp/rtl_switch_XXXXXX.py)
    cat > "$SWITCH_SCRIPT" << 'PYEOF'
#!/usr/bin/env python3
"""RTL8851BU USB mode switch: CDROM (0bda:1a2b) -> WiFi+BT (0bda:b851)"""
import usb.core
import struct
import time
import sys

def switch_mode():
    dev = usb.core.find(idVendor=0x0bda, idProduct=0x1a2b)
    if dev is None:
        print("ALREADY_SWITCHED")
        return True

    try:
        if dev.is_kernel_driver_active(0):
            dev.detach_kernel_driver(0)
    except Exception:
        pass

    cfg = dev.get_active_configuration()
    intf = cfg[(0, 0)]
    ep_out = ep_in = None
    for ep in intf:
        if usb.util.endpoint_direction(ep.bEndpointAddress) == usb.util.ENDPOINT_OUT:
            ep_out = ep
        else:
            ep_in = ep

    if not ep_out or not ep_in:
        print("NO_ENDPOINT")
        return False

    def send_scsi(cmd, tag):
        cbw = struct.pack('<IIIB', 0x43425355, tag, 0, 0)
        cbw += struct.pack('<BB', 0, len(cmd))
        cbw += cmd + b'\x00' * (31 - 6 - len(cmd))
        dev.write(ep_out.bEndpointAddress, cbw, timeout=5000)
        try:
            dev.read(ep_in.bEndpointAddress, 13, timeout=3000)
        except Exception:
            pass

    # ALLOW MEDIUM REMOVAL
    send_scsi(bytes([0x1e, 0, 0, 0, 0, 0]), 1)
    time.sleep(0.5)
    # START STOP UNIT (eject)
    send_scsi(bytes([0x1b, 0, 0, 0, 0x02, 0]), 2)
    time.sleep(2)

    if usb.core.find(idVendor=0x0bda, idProduct=0x1a2b) is None:
        print("SUCCESS")
        return True
    else:
        print("FAILED")
        return False

if __name__ == '__main__':
    success = switch_mode()
    sys.exit(0 if success else 1)
PYEOF

    python3 "$SWITCH_SCRIPT"
    SWITCH_RESULT=$?
    rm -f "$SWITCH_SCRIPT"

    if [ $SWITCH_RESULT -eq 0 ]; then
        ok "USB 模式切换成功!"
    else
        err "USB 模式切换失败，请检查设备连接"
    fi

elif echo "$CURRENT_ID" | grep -q "b851"; then
    ok "设备已在 WiFi+BT 模式 (0bda:b851)，无需切换"
else
    warn "未检测到 RTL8851BU 设备 (0bda:1a2b 或 0bda:b851)"
    warn "请检查 USB 是否连接正常"
fi

# ============================================================================
# 步骤 6: 加载模块并验证
# ============================================================================
echo ""
info "步骤 6/6: 加载驱动模块..."

# 加载 WiFi 模块
if ! lsmod | grep -q 8851bu; then
    modprobe 8851bu 2>/dev/null || warn "8851bu 模块加载失败"
fi

# 加载蓝牙模块
if ! lsmod | grep -q rtk_btusb; then
    modprobe rtk_btusb 2>/dev/null || warn "rtk_btusb 模块加载失败"
fi

# 解除 rfkill 封锁
rfkill unblock all 2>/dev/null || true

# ── 验证结果 ──
echo ""
echo "=========================================="
echo " 安装验证"
echo "=========================================="
echo ""

# WiFi 验证
if lsmod | grep -q 8851bu; then
    ok "WiFi 模块: 8851bu 已加载 ($(lsmod | grep 8851bu | awk '{print $2}') bytes)"
else
    warn "WiFi 模块: 8851bu 未加载"
fi

if ip link show wlan0 > /dev/null 2>&1; then
    WLAN_STATE=$(ip link show wlan0 | grep -oP 'state \K\w+')
    ok "WiFi 接口: wlan0 状态=$WLAN_STATE"
else
    warn "WiFi 接口: wlan0 未出现 (可能需要等待数秒或重启)"
fi

# 蓝牙验证
if lsmod | grep -q rtk_btusb; then
    ok "蓝牙模块: rtk_btusb 已加载"
else
    warn "蓝牙模块: rtk_btusb 未加载"
fi

if hciconfig hci0 > /dev/null 2>&1; then
    BD_ADDR=$(hciconfig hci0 | grep "BD Address" | awk '{print $3}')
    ok "蓝牙接口: hci0 地址=$BD_ADDR"
else
    warn "蓝牙接口: hci0 未出现"
fi

# USB 设备确认
echo ""
info "USB 设备状态:"
lsusb -d 0bda: 2>/dev/null || warn "未找到 Realtek USB 设备"

echo ""
echo "=========================================="
echo ""
echo -e " ${GREEN}安装完成!${NC}"
echo ""
echo " 如 wlan0 未出现，请尝试:"
echo "   1. 等待 5 秒后执行: ip link show wlan0"
echo "   2. 或重启系统: sudo reboot"
echo ""
echo " 连接 WiFi:"
echo "   nmcli device wifi list    # 扫描网络"
echo "   nmcli device wifi connect <SSID> password <密码>"
echo ""
echo " 设置开机自启:"
echo "   echo '8851bu'   | sudo tee -a /etc/modules"
echo "   echo 'rtk_btusb' | sudo tee -a /etc/modules"
echo ""
echo "=========================================="
