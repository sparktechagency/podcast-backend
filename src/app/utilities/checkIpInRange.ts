import ip from 'ip';

// Utility function to check if an IP address is within a CIDR range
export function checkIpInRange(userIp: string, wifiIpRange: string): boolean {
    return ip.cidrSubnet(wifiIpRange).contains(userIp);
}

//
/* 

if (!checkIpInRange(userIp, hotel.wifi_ip_range)) {
        return res.status(403).json({ error: 'Access Denied: Invalid IP for this hotel' });
    }

*/

/* 
CIDR format
192.168.1.0/24: This would represent all IPs from 192.168.1.1 to 192.168.1.254.
*/
