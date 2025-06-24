import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { ServiceApprovalRequest } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface ServiceRequestListProps {
  status: "pending" | "approved" | "rejected";
}

export const ServiceRequestList: React.FC<ServiceRequestListProps> = ({
  status,
}) => {
  const [requests, setRequests] = useState<ServiceApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const requestsRef = collection(db, "service_approval_requests");

        let requestsQuery;
        try {
          requestsQuery = query(
            requestsRef,
            where("status", "==", status),
            orderBy("createdAt", "desc")
          );
        } catch (indexError) {
          console.log(
            "ServiceRequestList: Using simple query due to index error:",
            indexError
          );

          requestsQuery = query(requestsRef, where("status", "==", status));
        }

        const snapshot = await getDocs(requestsQuery);
        let requestsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          service: {
            ...doc.data().service,
            date: doc.data().service.date?.toDate(),
          },
        })) as ServiceApprovalRequest[];

        if (!requestsQuery.toString().includes("orderBy")) {
          requestsData = requestsData.sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
        }

        setRequests(requestsData);
      } catch (error) {
        console.error("Error fetching requests:", error);

        if (error.code === "permission-denied") {
          console.log(
            "ServiceRequestList: Permission denied - user may not have admin access"
          );
        }
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [status]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-32 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nu există cereri{" "}
        {status === "pending"
          ? "în așteptare"
          : status === "approved"
          ? "aprobate"
          : "respinse"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{request.service.name}</h3>
              <p className="text-gray-600">{request.vendorName}</p>
              <p className="text-sm text-gray-500">
                {request.createdAt
                  ? request.createdAt.toLocaleDateString()
                  : "Data necunoscută"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* Handle view details */
              }}
            >
              Vezi detalii
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
