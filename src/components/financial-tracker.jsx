"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { db } from "@/lib/firebase";
import { ref, onValue, push, remove } from "firebase/database";
import styles from "./financial-tracker.module.css";

export default function FinancialTracker() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("salary");
  const [loading, setLoading] = useState(false);

  // Fetch transactions from Firebase
  useEffect(() => {
    if (!user || !db) return;

    const transactionsRef = ref(db, `users/${user.uid}/transactions`);
    const unsubscribe = onValue(transactionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const transactionsList = Object.entries(data)
          .map(([id, transaction]) => ({ id, ...transaction }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(transactionsList);
      } else {
        setTransactions([]);
      }
    });

    return unsubscribe;
  }, [user]);

  // Add new transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();

    if (!amount || !description || !user || !db) {
      alert("Silakan isi semua field");
      return;
    }

    setLoading(true);

    try {
      const transactionsRef = ref(db, `users/${user.uid}/transactions`);
      await push(transactionsRef, {
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date().toISOString(),
      });

      // Reset form
      setAmount("");
      setDescription("");
      setCategory("salary");
      setType("income");
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Gagal menambah transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (!user || !db) return;

    try {
      const transactionRef = ref(
        db,
        `users/${user.uid}/transactions/${transactionId}`
      );
      await remove(transactionRef);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Gagal menghapus transaksi");
    }
  };

  // Calculate summary
  const summary = transactions.reduce(
    (acc, transaction) => {
      if (transaction.type === "income") {
        acc.totalIncome += transaction.amount;
      } else {
        acc.totalExpense += transaction.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0 }
  );

  const balance = summary.totalIncome - summary.totalExpense;

  return (
    <div className={`${styles.container} ${isDark ? styles.darkMode : ""}`}>
      <div className={`${styles.header} ${isDark ? styles.darkHeader : ""}`}>
        <h2 className={isDark ? styles.darkTitle : ""}>Tracker Keuangan</h2>
      </div>

      {/* Balance Summary with BCA Logo */}
      <div className={`${styles.balanceCard} ${isDark ? styles.darkBalanceCard : ""}`}>
        <div className={styles.balanceContent}>
          <div className={styles.balanceText}>
            <span className={styles.balanceLabel}>Saldo</span>
            <span className={`${styles.balanceAmount} ${isDark ? styles.darkBalanceAmount : ""}`}>
              Rp {balance.toLocaleString("id-ID")}
            </span>
          </div>
          <img 
            src="https://i.ibb.co/6RWfh27B/pngegg-7.png" 
            alt="BCA Logo" 
            className={`${styles.bcaLogo} ${isDark ? styles.darkBcaLogo : ""}`}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={`${styles.card} ${styles.income}`}>
          <div className={styles.label}>Uang Masuk</div>
          <div className={styles.amount}>
            Rp {summary.totalIncome.toLocaleString("id-ID")}
          </div>
        </div>

        <div className={`${styles.card} ${styles.expense}`}>
          <div className={styles.label}>Uang Keluar</div>
          <div className={styles.amount}>
            Rp {summary.totalExpense.toLocaleString("id-ID")}
          </div>
        </div>
      </div>

      {/* Add Transaction Form & Transactions List - Horizontal Layout */}
      <div className={styles.contentWrapper}>
        {/* Add Transaction Form */}
        <div className={`${styles.formSection} ${isDark ? styles.darkFormSection : ""}`}>
          <h3 className={isDark ? styles.darkText : ""}>Tambah Transaksi</h3>
          <form onSubmit={handleAddTransaction} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={isDark ? styles.darkLabel : ""}>Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`${styles.select} ${isDark ? styles.darkSelect : ""}`}
              >
                <option value="income">Uang Masuk</option>
                <option value="expense">Uang Keluar</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={isDark ? styles.darkLabel : ""}>Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${styles.select} ${isDark ? styles.darkSelect : ""}`}
              >
                {type === "income" ? (
                  <>
                    <option value="salary">Gaji</option>
                    <option value="bonus">Bonus</option>
                    <option value="freelance">Freelance</option>
                    <option value="investment">Investasi</option>
                    <option value="other">Lainnya</option>
                  </>
                ) : (
                  <>
                    <option value="food">Makanan</option>
                    <option value="transport">Transportasi</option>
                    <option value="utilities">Utilitas</option>
                    <option value="entertainment">Hiburan</option>
                    <option value="shopping">Belanja</option>
                    <option value="other">Lainnya</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={isDark ? styles.darkLabel : ""}>Jumlah</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className={`${styles.input} ${isDark ? styles.darkInput : ""}`}
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={isDark ? styles.darkLabel : ""}>Deskripsi</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ketik deskripsi..."
                className={`${styles.input} ${isDark ? styles.darkInput : ""}`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${styles.submitBtn} ${isDark ? styles.darkSubmitBtn : ""}`}
            >
              {loading ? "Menambah..." : "Tambah Transaksi"}
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div className={`${styles.transactionsSection} ${isDark ? styles.darkTransactionsSection : ""}`}>
          <h3 className={isDark ? styles.darkText : ""}>Riwayat Transaksi</h3>
          {transactions.length === 0 ? (
            <p className={`${styles.noData} ${isDark ? styles.darkNoData : ""}`}>Belum ada transaksi</p>
          ) : (
            <div className={styles.transactionsList}>
              {transactions.map((transaction) => (
                <div key={transaction.id} className={styles.transactionItem}>
                  <div className={styles.transactionInfo}>
                    <div className={styles.transactionHeader}>
                      <span className={`${styles.description} ${isDark ? styles.darkDescription : ""}`}>
                        {transaction.description}
                      </span>
                      <span className={`${styles.category} ${isDark ? styles.darkCategory : ""}`}>{transaction.category}</span>
                    </div>
                    <div className={styles.transactionDate}>
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className={styles.transactionAmount}>
                    <span
                      className={`${styles.amount} ${
                        transaction.type === "income"
                          ? styles.incomeText
                          : styles.expenseText
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"} Rp{" "}
                      {transaction.amount.toLocaleString("id-ID")}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className={styles.deleteBtn}
                      title="Hapus transaksi"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
