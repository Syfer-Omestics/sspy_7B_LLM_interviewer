
<script lang="ts" setup>
import { reactive, ref } from "vue";
import {
  NModal,
  NSpace,
  NForm,
  NFormItem,
  NDatePicker,
  NRadioGroup,
  NRadio,
  FormInst,
  NInput,
  NButton,
  FormItemRule,
} from "naive-ui";
import apiLog from "@/api/apiLog";

const phoneReg =
  /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/;
// const telReg = /^0\d{2,3}-?\d{7,8}$/;
const idReg =
  /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

interface Props {
  showModal: boolean;
  instanceId: string | number;
  sessionId: string | null;
}

interface Emit {
  (ev: "handleCancel"): void;
  (ev: "saveSessionLog"): void;
}

const initFormValue = () => ({
  questionCategory: "",
  description: "",
  urgencyLevel: "",
  deadlineDate: null,
  phoneNumber: "",
  cName: "",
  idNumber: "",
});

const formRef = ref<FormInst | null>(null);
const formValue = reactive(initFormValue());
const ruleRef = ref({
  questionCategory: {
    required: true,
    message: "请输入问题类别",
    trigger: ["input"],
  },
  description: {
    required: true,
    message: "请输入问题描述",
    trigger: ["input"],
  },
  urgencyLevel: {
    required: true,
    message: "请选择紧急程度",
    trigger: ["input"],
  },
  deadlineDate: {
    required: true,
    message: "请选择日期",
  },
  phoneNumber: {
    required: true,
    trigger: ["blur"],
    validator: (rule: FormItemRule, value: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!value) {
          reject(Error("请填写手机号"));
        } else if (!phoneReg.test(value)) {
          reject(Error("请填写正确的手机号"));
        } else {
          resolve();
        }
      });
    },
  },
  cName: {
    required: true,
    message: "请填写联系人姓名",
    trigger: ["input"],
  },
  idNumber: {
    required: true,
    trigger: ["blur"],
    validator: (rule: FormItemRule, value: string) => {
      return new Promise<void>((resolve, reject) => {
        if (!value) {
          reject(Error("请填写身份证号"));
        } else if (!idReg.test(value)) {
          reject(Error("请填写正确的身份证号"));
        } else {
          resolve();
        }
      });
    },
  },
});

const props = defineProps<Props>();
const emit = defineEmits<Emit>();

const handleAnswerResponse = () => {
  const { instanceId, sessionId } = props;
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      console.log("验证通过");
      let data = {
        instanceId,
        sessionId,
        requestParams: formValue,
      };
      const res = await apiLog.handleAnswerResponse(data);
      emit("saveSessionLog");
      emit("handleCancel");
      window?.$message?.success(res.msg);
    } else {
      console.log(errors);
    }
  });
};

const afterClose = () => {
  // 清除表单数据
  Object.assign(formValue, initFormValue());
};
</script>

<template>
  <NModal
    v-model:show="props.showModal"
    title="问答投诉"
    preset="card"
    style="width: 600px"
    header-style="text-align:center"
    :on-after-leave="afterClose"
    :on-close="() => emit('handleCancel')"
  >
    <NForm
      ref="formRef"
      label-placement="left"
      label-width="auto"
      :model="formValue"
      :rules="ruleRef"
    >
      <div class="font-bold mb-4">问题反馈：</div>
      <NFormItem label="问题类别" path="questionCategory">
        <NInput
          v-model:value="formValue.questionCategory"
          placeholder="输入问题类别"
        />
      </NFormItem>
      <NFormItem label="问题描述" path="description">
        <NInput
          v-model:value="formValue.description"
          placeholder="输入问题描述"
          type="textarea"
        />
      </NFormItem>
      <NFormItem label="紧急程度" path="urgencyLevel">
        <NRadioGroup v-model:value="formValue.urgencyLevel" name="urgencyLevel">
          <NSpace>
            <NRadio value="LOW"> 低 </NRadio>
            <NRadio value="NORMAL"> 中 </NRadio>
            <NRadio value="HIGH"> 高 </NRadio>
          </NSpace>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="期待解决日期" path="deadlineDate">
        <NDatePicker v-model:value="formValue.deadlineDate" type="date" />
      </NFormItem>
      <div class="font-bold mb-4">联系人信息：</div>
      <NFormItem label="姓名" path="cName">
        <NInput v-model:value="formValue.cName" placeholder="输入姓名" />
      </NFormItem>
      <NFormItem label="手机号" path="phoneNumber">
        <NInput
          v-model:value="formValue.phoneNumber"
          placeholder="输入手机号"
        />
      </NFormItem>
      <NFormItem label="身份证号" path="idNumber">
        <NInput v-model:value="formValue.idNumber" placeholder="填写身份证号" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('handleCancel')">{{
          $t("common.cancel")
        }}</NButton>
        <NButton class="ml-4" type="primary" @click="handleAnswerResponse">{{
          $t("common.confirm")
        }}</NButton>
      </NSpace>
    </template>
  </NModal>
</template>
